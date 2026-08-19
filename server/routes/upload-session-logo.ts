import { RequestHandler } from "express";
import { ensureBucketExists, supabaseAdmin } from "../lib/supabase";

const extensionFor = (contentType: string) => {
  const extensions: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
  };
  return extensions[contentType];
};

export const handleCreateSessionLogoUpload: RequestHandler = async (req, res) => {
  const { contentType, bucket = "shm-sessions" } = req.body || {};
  const storageBucket = bucket === "shm-reports" || bucket === "shm-sessions" ? bucket : undefined;
  const extension = typeof contentType === "string" ? extensionFor(contentType) : undefined;

  if (!storageBucket || !extension) {
    res.status(400).json({ error: "Format de logo non supporté" });
    return;
  }

  try {
    await ensureBucketExists(storageBucket);
    const path = `logos/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await supabaseAdmin.storage
      .from(storageBucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      res.status(500).json({ error: error?.message || "Impossible de préparer l’upload du logo" });
      return;
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from(storageBucket)
      .getPublicUrl(path);

    res.json({ path, token: data.token, publicUrl: publicUrl.publicUrl });
  } catch (error: any) {
    console.error("Session logo upload preparation error:", error);
    res.status(500).json({ error: error.message || "Impossible de préparer l’upload du logo" });
  }
};
