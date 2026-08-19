import { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

export const handleGenerateSession: RequestHandler = async (req, res) => {
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

  let payload: any;
  try {
    payload = parsePayload(req.body);
    payload = payload?.body ?? payload?.data ?? payload?.formData ?? payload;
    payload = parsePayload(payload);
  } catch {
    res.status(400).json({ error: "Corps de requête invalide ou trop volumineux" });
    return;
  }

  const {
    title, dateTime, targetAudience, objective, methodology, location
  } = payload || {};

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Le titre de la séance est obligatoire" });
    return;
  }

  if (typeof dateTime !== "string" || !dateTime.trim()) {
    res.status(400).json({ error: "La date de la séance est obligatoire" });
    return;
  }

  try {
    const { data, error: dbError } = await supabaseAdmin
      .from("sessions")
      .insert([
        {
          title,
          date: dateTime,
          date_time: dateTime,
          location,
          target_audience: targetAudience,
          objective,
          methodology_original: methodology,
          methodology_reformulated: methodology,
          pdf_url: null,
        }
      ])
      .select();

    if (dbError) {
      console.error("Database insert error:", dbError);
      res.status(500).json({ error: dbError.message || "Failed to save session" });
      return;
    }

    res.json({ success: true, message: "Session saved successfully", data });
  } catch (error: any) {
    console.error("Error saving session:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
