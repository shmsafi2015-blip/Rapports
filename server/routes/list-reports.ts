import { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

export const handleGetReport: RequestHandler = async (req, res) => {
  const { data: report, error } = await supabaseAdmin
    .from("reports")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) {
    res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message, code: error.code });
    return;
  }

  res.json({ report });
};

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
