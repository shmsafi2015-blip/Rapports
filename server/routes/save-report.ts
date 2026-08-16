import { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

export const handleSaveReport: RequestHandler = async (req, res) => {
  const payload = req.body?.body && typeof req.body.body === "object"
    ? req.body.body
    : req.body;
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
    unit_logo,
  } = payload || {};

  if (typeof title !== "string" || !title.trim() || typeof date !== "string" || !date.trim() || typeof pdf_url !== "string" || !pdf_url.trim()) {
    res.status(400).json({ error: "title, date and pdf_url are required" });
    return;
  }

  const report = {
    ...(id ? { id } : {}),
    title,
    location,
    created_at: `${date}T00:00:00.000Z`,
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
    pdf_url,
    unit_logo,
  };

  const { error } = await supabaseAdmin
    .from("reports")
    .upsert(report, { onConflict: "id" });

  if (error) {
    console.error("Report persistence error:", error);
    res.status(500).json({ error: error.message, code: error.code });
    return;
  }

  res.json({ success: true, report });
};
