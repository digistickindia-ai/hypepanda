"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import TabBar from "../TabBar";

export default function Profile() {
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

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return <main style={{ minHeight: "100dvh", background: "var(--cream)" }} />;
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "28px 22px 20px" }}>

        <div style={{ background: "var(--pink)", borderRadius: 28, padding: "30px 24px", textAlign: "center", marginBottom: 18 }}>
          <div className="blob" style={{ marginBottom: 12 }}>
            <svg width="84" height="84" viewBox="0 0 84 84" style={{ margin: "0 auto" }}>
              <ellipse cx="42" cy="46" rx="34" ry="32" fill="#fff" stroke="var(--ink)" strokeWidth="2.5" />
              <ellipse cx="19" cy="25" rx="12" ry="13" fill="var(--ink)" /><ellipse cx="65" cy="25" rx="12" ry="13" fill="var(--ink)" />
              <ellipse cx="31" cy="44" rx="9.5" ry="11" fill="var(--ink)" /><circle cx="28" cy="40" r="3.5" fill="#fff" />
              <ellipse cx="53" cy="44" rx="9.5" ry="11" fill="var(--ink)" /><circle cx="50" cy="40" r="3.5" fill="#fff" />
              <ellipse cx="42" cy="56" rx="4.5" ry="3.5" fill="var(--ink)" />
              <path d="M35 63 Q42 69 49 63" stroke="var(--ink)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#4B1528" }}>{profile.full_name}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#993556", marginTop: 2 }}>
            @{profile.instagram_handle} &#183; {profile.city}
          </div>
          {profile.instagram_connected ? (
            <span style={{ display: "inline-block", marginTop: 10, background: "#173404", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 14 }}>&#10003; Verified</span>
          ) : (
            <span style={{ display: "inline-block", marginTop: 10, background: "#fff", color: "#993556", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 14 }}>Not yet verified</span>
          )}
        </div>

        <div style={{ background: "#fff", borderRadius: 22, padding: 8, border: "1.5px solid #efe7d6", marginBottom: 16 }}>
          {[
            { k: "Niche", v: profile.niche },
            { k: "Rate per post", v: "&#8377;" + profile.rate_per_post?.toLocaleString("en-IN") },
            { k: "City", v: profile.city },
          ].map((row, i) => (
            <div key={row.k} style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", borderBottom: i < 2 ? "1.5px solid #f4eede" : "none" }}>
              <span style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600 }}>{row.k}</span>
              <span style={{ fontSize: 15, color: "var(--ink)", fontWeight: 700 }} dangerouslySetInnerHTML={{ __html: row.v }} />
            </div>
          ))}
        </div>

        <button onClick={() => router.push("/app/onboarding")} className="pressable" style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 22, padding: "15px", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
          Edit profile
        </button>
        <button onClick={signOut} className="pressable" style={{ width: "100%", background: "#fff", color: "var(--muted)", border: "1.5px solid #efe7d6", borderRadius: 22, padding: "15px", fontSize: 15, fontWeight: 700 }}>
          Sign out
        </button>
      </div>

      <TabBar />
    </div>
  );
}
