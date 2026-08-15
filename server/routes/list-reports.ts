import { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

export const handleListReports: RequestHandler = async (_req, res) => {
  const [{ data: reports, error: reportsError }, { data: sessions, error: sessionsError }] = await Promise.all([
    supabaseAdmin.from("reports").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("sessions").select("*").order("created_at", { ascending: false }),
  ]);

  if (reportsError || sessionsError) {
    const error = reportsError || sessionsError;
    console.error("Reports listing error:", error);
    res.status(500).json({ error: error?.message || "Unable to fetch reports", code: error?.code || "" });
    return;
  }

  res.json({ reports: reports || [], sessions: sessions || [] });
};
