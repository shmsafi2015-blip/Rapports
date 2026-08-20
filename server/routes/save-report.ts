import { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

export const handleSaveReport: RequestHandler = async (req, res) => {
  const parsePayload = (value: unknown) => {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      try {
        return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
      } catch {
        throw new Error("INVALID_REQUEST_BODY");
      }
    }
  };

  const findPayload = (value: unknown, requiredKey: string, depth = 0): any => {
    const parsed = parsePayload(value) as any;
    if (!parsed || typeof parsed !== "object" || depth > 3) return parsed;
    if (Object.prototype.hasOwnProperty.call(parsed, requiredKey)) return parsed;

    for (const key of ["body", "data", "formData", "payload"]) {
      if (parsed[key] !== undefined) {
        const nested = findPayload(parsed[key], requiredKey, depth + 1);
        if (nested && Object.prototype.hasOwnProperty.call(nested, requiredKey)) return nested;
      }
    }

    return parsed;
  };

  let payload: any;
  try {
    payload = findPayload(req.body, "title");
  } catch {
    res.status(400).json({ error: "Corps de requête invalide ou trop volumineux" });
    return;
  }

  const {
    id,
    title,
    location,
    date,
    time,
    objective,
    participants_boys,
    participants_girls,
    leaders_count,
    category,
    beneficiary,
    description_original,
    description_reformulated,
    evaluation_positive,
    evaluation_negative,
    recommendations,
    pdf_url,
  } = payload || {};

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Le titre du rapport est obligatoire" });
    return;
  }

  if (typeof date !== "string" || !date.trim()) {
    res.status(400).json({ error: "La date du rapport est obligatoire" });
    return;
  }

  const report = {
    ...(id ? { id } : {}),
    title: typeof title === "string" && title.trim() ? title.trim() : "Sans titre",
    location,
    created_at: typeof date === "string" && date.trim()
      ? `${date}T00:00:00.000Z`
      : new Date().toISOString(),
    time,
    objective,
    participants_boys: Number(participants_boys) || 0,
    participants_girls: Number(participants_girls) || 0,
    leaders_count: Number(leaders_count) || 0,
    category,
    beneficiary,
    description_original,
    description_reformulated,
    evaluation_positive,
    evaluation_negative,
    recommendations,
    ...(typeof pdf_url === "string" && pdf_url.trim() ? { pdf_url } : {}),
  };

  const { data: savedReport, error } = await supabaseAdmin
    .from("reports")
    .upsert(report, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Report persistence error:", error);
    res.status(500).json({ error: error.message, code: error.code });
    return;
  }

  res.json({ success: true, report: savedReport });
};
