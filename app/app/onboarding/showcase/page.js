"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { uploadVideo, MAX_VIDEO_MB } from "@/lib/storage";

const MIN_VIDEOS = 2;
const MAX_VIDEOS = 3;

export default function Showcase() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [finishing, setFinishing] = useState(false);

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/app"); return; }
    setUser(user);
    const { data } = await supabase.from("portfolio").select("*").eq("creator_id", user.id).order("created_at");
    setVideos(data || []);
  })(); }, []);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    if (!file.type.startsWith("video/")) { setErr("Please choose a video file."); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { setErr(`Video must be under ${MAX_VIDEO_MB} MB. Try a shorter clip.`); return; }
    if (videos.length >= MAX_VIDEOS) { setErr(`You can add up to ${MAX_VIDEOS} videos.`); return; }

    setUploading(true);
    try {
      const { url, path } = await uploadVideo(supabase, user.id, file);
      const { data, error } = await supabase.from("portfolio").insert({
        creator_id: user.id, video_url: url, storage_path: path, status: "pending",
      }).select().single();
      if (error) throw error;
      setVideos((v) => [...v, data]);
    } catch (e) {
      setErr("Upload failed: " + (e.message || "try again"));
    }
    setUploading(false);
  };

  const remove = async (vid) => {
    await supabase.from("portfolio").delete().eq("id", vid.id);
    if (vid.storage_path) await supabase.storage.from("showcase").remove([vid.storage_path]);
    setVideos((v) => v.filter((x) => x.id !== vid.id));
  };

  const finish = async () => {
    if (videos.length < MIN_VIDEOS) return;
    setFinishing(true);
    await supabase.from("profiles").update({ showcase_done: true }).eq("id", user.id);
    router.replace("/app/home");
  };

  const enough = videos.length >= MIN_VIDEOS;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "32px 24px 40px" }}>

        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div className="blob" style={{ display: "inline-block" }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="36" fill="var(--pink)" />
              <ellipse cx="36" cy="40" rx="3.5" ry="7" fill="var(--ink)" /><ellipse cx="54" cy="40" rx="3.5" ry="7" fill="var(--ink)" />
              <path d="M34 56 Q45 64 56 56" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", textAlign: "center", margin: "0 0 8px" }}>Show your best work</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500, textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
          Add {MIN_VIDEOS}–{MAX_VIDEOS} short videos of your best content. Brands see these on your profile. Our team reviews each one before it goes live.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {videos.map((v) => (
            <div key={v.id} style={{ background: "#fff", borderRadius: 18, padding: 12, border: "1.5px solid #efe7d6" }}>
              <video src={v.video_url} controls style={{ width: "100%", borderRadius: 12, background: "#000", maxHeight: 220 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)", background: "#FAEEDA", padding: "4px 10px", borderRadius: 10, color: "#854F0B" }}>⏳ Pending review</span>
                <button onClick={() => remove(v)} style={{ fontSize: 13, fontWeight: 700, color: "#A32D2D" }}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        {videos.length < MAX_VIDEOS && (
          <label style={{ display: "block", textAlign: "center", background: "#fff", border: "2.5px dashed #d8cfbc", borderRadius: 18, padding: "28px 20px", cursor: uploading ? "default" : "pointer", marginBottom: 8 }}>
            <input type="file" accept="video/*" onChange={onPick} disabled={uploading} style={{ display: "none" }} />
            <div style={{ fontSize: 32, marginBottom: 6 }}>{uploading ? "⏳" : "🎬"}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{uploading ? "Uploading…" : "Tap to add a video"}</div>
            <div style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600, marginTop: 4 }}>Under {MAX_VIDEO_MB} MB · mp4, mov</div>
          </label>
        )}

        {err && <p style={{ fontSize: 13, color: "#A32D2D", fontWeight: 600, textAlign: "center", marginBottom: 8 }}>{err}</p>}

        <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, textAlign: "center", margin: "8px 0 16px" }}>{videos.length} of {MAX_VIDEOS} added{!enough ? ` · need at least ${MIN_VIDEOS}` : ""}</p>

        <button className="pressable" disabled={!enough || finishing || uploading} onClick={finish} style={{
          width: "100%", background: enough ? "var(--ink)" : "#d8cfbc", color: "#fff", border: "none",
          borderRadius: 32, padding: "17px", fontSize: 17, fontWeight: 800, cursor: enough ? "pointer" : "default",
        }}>{finishing ? "Finishing…" : enough ? "Finish 🎉" : `Add ${MIN_VIDEOS - videos.length} more`}</button>
      </div>
    </main>
  );
}
