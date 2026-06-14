"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadMe, inr, fmtFollowers } from "@/lib/me";
import { uploadPhoto, MAX_PHOTO_MB } from "@/lib/storage";
import Panda from "../../Panda";
import TabBar from "../TabBar";

function ProfileInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [igMsg, setIgMsg] = useState("");
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tab, setTab] = useState("photos");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const ig = params.get("ig");
    if (ig === "done") setIgMsg("Instagram connected! Your follower count is now live.");
    if (ig === "notready") setIgMsg("Instagram verification isn't switched on yet — your Meta app needs approval first.");
    (async () => {
      const res = await loadMe(router);
      if (!res) return;
      setMe(res);
      if (res.profile.role === "creator") {
        const { data: ph } = await res.supabase.from("photos").select("*").eq("creator_id", res.profile.id).order("created_at", { ascending: false });
        setPhotos(ph || []);
        const { data: vd } = await res.supabase.from("portfolio").select("*").eq("creator_id", res.profile.id).order("created_at", { ascending: false });
        setVideos(vd || []);
      }
      setLoading(false);
    })();
  }, []);

  const signOut = async () => { await me.supabase.auth.signOut(); router.replace("/"); };

  const addPhoto = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please choose an image."); return; }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) { alert(`Photo must be under ${MAX_PHOTO_MB} MB.`); return; }
    setUploading(true);
    try {
      const { url, path } = await uploadPhoto(me.supabase, me.profile.id, file);
      const { data } = await me.supabase.from("photos").insert({ creator_id: me.profile.id, photo_url: url, storage_path: path }).select().single();
      setPhotos((p) => [data, ...p]);
    } catch (e) { alert("Upload failed: " + e.message); }
    setUploading(false);
  };

  const removePhoto = async (ph) => {
    await me.supabase.from("photos").delete().eq("id", ph.id);
    if (ph.storage_path) await me.supabase.storage.from("showcase").remove([ph.storage_path]);
    setPhotos((p) => p.filter((x) => x.id !== ph.id));
  };

  if (loading) return <main style={{ minHeight: "100dvh", background: "var(--cream)" }} />;

  const p = me.profile;
  const isCreator = p.role === "creator";
  const colors = ["var(--coral)", "var(--blue)", "var(--pink)", "var(--yellow)", "var(--green)"];
  const col = colors[(p.full_name || "x").charCodeAt(0) % colors.length];
  const initials = (p.full_name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ height: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "24px 18px 20px", overflowY: "auto" }}>

        {igMsg && <div style={{ background: "var(--green)", color: "#173404", borderRadius: 16, padding: "12px 16px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{igMsg}</div>}

        {/* Profile header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <div style={{ width: 78, height: 78, borderRadius: "50%", background: col, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{initials}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
              {p.full_name}
              {isCreator && p.instagram_connected && <span style={{ background: "#173404", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 10 }}>✓</span>}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
              {isCreator ? "@" + p.instagram_handle : p.company_name} · {p.city}
            </div>
          </div>
        </div>

        {/* Stats row (creator) */}
        {isCreator && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <Stat n={p.instagram_connected ? fmtFollowers(p.followers) : "—"} l="followers" />
            <Stat n={p.niche} l="niche" />
            <Stat n={inr(p.rate_per_post)} l="per post" />
          </div>
        )}

        {/* IG verify button */}
        {isCreator && !p.instagram_connected && (
          <a href="/api/instagram/connect" className="pressable" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#E1306C", color: "#fff", borderRadius: 18, padding: "13px", fontSize: 14, fontWeight: 800, textDecoration: "none", marginBottom: 16 }}>
            ◎ Verify with Instagram
          </a>
        )}

        {/* Admin / actions */}
        {p.is_admin && <button onClick={() => router.push("/admin")} className="pressable" style={{ width: "100%", background: "var(--coral)", color: "#4A1B0C", border: "none", borderRadius: 16, padding: "13px", fontSize: 14, fontWeight: 800, marginBottom: 10 }}>🛠 Admin panel</button>}

        {isCreator ? (
          <>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, margin: "8px 0 14px" }}>
              <TabBtn label={`Photos (${photos.length})`} active={tab === "photos"} onClick={() => setTab("photos")} />
              <TabBtn label={`Reels (${videos.length})`} active={tab === "reels"} onClick={() => setTab("reels")} />
            </div>

            {tab === "photos" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <label style={{ aspectRatio: "1", borderRadius: 12, border: "2.5px dashed #d8cfbc", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <input type="file" accept="image/*" onChange={addPhoto} disabled={uploading} style={{ display: "none" }} />
                  <span style={{ fontSize: 24 }}>{uploading ? "⏳" : "+"}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{uploading ? "" : "Add"}</span>
                </label>
                {photos.map((ph) => (
                  <div key={ph.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden", background: "#eee" }}>
                    <img src={ph.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => removePhoto(ph)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {videos.map((v) => (
                  <div key={v.id} style={{ background: "#fff", borderRadius: 16, padding: 10, border: "1.5px solid #efe7d6" }}>
                    <video src={v.video_url} controls playsInline style={{ width: "100%", borderRadius: 10, background: "#000", maxHeight: 220 }} />
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700 }}>
                      {v.status === "approved" && <span style={{ color: "#173404" }}>✓ Live</span>}
                      {v.status === "pending" && <span style={{ color: "#854F0B" }}>⏳ Pending review</span>}
                      {v.status === "rejected" && <span style={{ color: "#A32D2D" }}>✕ Rejected</span>}
                    </div>
                  </div>
                ))}
                <button onClick={() => router.push("/app/onboarding/showcase")} className="pressable" style={{ background: "#fff", border: "2.5px dashed #d8cfbc", borderRadius: 16, padding: "16px", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>+ Add a reel</button>
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              <button onClick={() => router.push("/app/onboarding?role=creator")} className="pressable" style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Edit profile</button>
              <button onClick={signOut} className="pressable" style={{ width: "100%", background: "#fff", color: "var(--muted)", border: "1.5px solid #efe7d6", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 700 }}>Sign out</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: "#fff", borderRadius: 18, padding: 8, border: "1.5px solid #efe7d6", marginBottom: 16 }}>
              {[{ k: "Company", v: p.company_name }, { k: "Looking for", v: p.niche }, { k: "City", v: p.city }].map((row, i, arr) => (
                <div key={row.k} style={{ display: "flex", justifyContent: "space-between", padding: "13px 14px", borderBottom: i < arr.length - 1 ? "1.5px solid #f4eede" : "none" }}>
                  <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>{row.k}</span>
                  <span style={{ fontSize: 14, color: "var(--ink)", fontWeight: 700 }}>{row.v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/app/onboarding?role=" + p.role)} className="pressable" style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Edit profile</button>
            <button onClick={signOut} className="pressable" style={{ width: "100%", background: "#fff", color: "var(--muted)", border: "1.5px solid #efe7d6", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 700 }}>Sign out</button>
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}

function Stat({ n, l }) {
  return <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "12px 8px", border: "1.5px solid #efe7d6", textAlign: "center" }}>
    <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n}</div>
    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{l}</div>
  </div>;
}
function TabBtn({ label, active, onClick }) {
  return <button onClick={onClick} style={{ flex: 1, padding: "11px", borderRadius: 14, fontSize: 14, fontWeight: 800, border: active ? "2px solid var(--ink)" : "2px solid #e8dfcc", background: active ? "var(--ink)" : "#fff", color: active ? "#fff" : "var(--ink)" }}>{label}</button>;
}

export default function Profile() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100dvh", background: "var(--cream)" }} />}>
      <ProfileInner />
    </Suspense>
  );
}
