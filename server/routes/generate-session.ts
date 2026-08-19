import { RequestHandler } from "express";
import { supabaseAdmin, ensureBucketExists } from "../lib/supabase";

export const handleGenerateSession: RequestHandler = async (req, res) => {
  let payload = req.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }

  payload = payload?.body ?? payload?.data ?? payload?.formData ?? payload;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }

  const {
    title, dateTime, targetAudience, objective, methodology, location, logos = []
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
    // Ensure storage bucket exists for logos
    await ensureBucketExists("shm-sessions");

    // Process logos and upload to storage
    const logoUrls: string[] = [];
    for (const logo of (logos as any[]).slice(0, 3)) {
      try {
        const buffer = Buffer.from(logo.data, 'base64');
        const fileName = `session_logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${logo.type.split('/')[1] || 'png'}`;
        
        const { data, error } = await supabaseAdmin.storage
          .from("shm-sessions")
          .upload(`logos/${fileName}`, buffer, {
            contentType: logo.type,
            upsert: false
          });

        if (error) {
          console.error("Logo upload error:", error);
          continue;
        }

        if (data) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from("shm-sessions")
            .getPublicUrl(`logos/${fileName}`);
          logoUrls.push(publicUrl);
        }
      } catch (e) {
        console.error("Logo processing error:", e);
      }
    }

    // Insert session data into database (no PDF generation)
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
