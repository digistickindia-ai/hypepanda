"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import TabBar from "../TabBar";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/app"); return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!prof || !prof.onboarding_done) { router.replace("/app/onboarding"); return; }
      setProfile(prof);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="blob"><svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="var(--yellow)" />
          <circle cx="31" cy="35" r="6" fill="#fff" /><circle cx="32" cy="36" r="3" fill="var(--ink)" />
          <circle cx="49" cy="35" r="6" fill="#fff" /><circle cx="50" cy="36" r="3" fill="var(--ink)" />
          <path d="M31 50 Q40 58 51 48" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg></div>
      </main>
    );
  }

  const first = (profile.full_name || "there").split(" ")[0];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "28px 22px 20px" }}>
        <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, margin: 0 }}>Hey {first} &#128075;</p>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", margin: "4px 0 24px" }}>Your panda HQ</h1>

        <div style={{ background: "var(--coral)", borderRadius: 24, padding: 22, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#712B13", textTransform: "uppercase", letterSpacing: "0.5px" }}>Profile strength</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#4A1B0C", margin: "6px 0 12px" }}>
            {profile.instagram_connected ? "100%" : "80%"}
          </div>
          {!profile.instagram_connected && (
            <button onClick={() => alert("Instagram verification gets switched on in the next build step — it'll auto-pull your real follower count.")} className="pressable" style={{ background: "#4A1B0C", color: "#fff", border: "none", borderRadius: 20, padding: "10px 18px", fontSize: 14, fontWeight: 700 }}>
              Verify Instagram &#8594;
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 20, padding: 18, border: "1.5px solid #efe7d6" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{profile.niche}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>your niche</div>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 20, padding: 18, border: "1.5px solid #efe7d6" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>&#8377;{profile.rate_per_post?.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>per post</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: 22, border: "1.5px solid #efe7d6", textAlign: "center" }}>
          <div className="blobSlow" style={{ marginBottom: 8 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ margin: "0 auto" }}>
              <circle cx="32" cy="32" r="26" fill="var(--blue)" />
              <circle cx="25" cy="28" r="5" fill="#fff" /><circle cx="26" cy="29" r="2.5" fill="var(--ink)" />
              <circle cx="39" cy="28" r="5" fill="#fff" /><circle cx="40" cy="29" r="2.5" fill="var(--ink)" />
              <path d="M25 40 Q32 47 41 39" stroke="var(--ink)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>No offers yet</div>
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>When brands send you collab offers, they&apos;ll show up here.</div>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
