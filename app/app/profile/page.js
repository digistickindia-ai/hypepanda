"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadMe, inr, fmtFollowers } from "@/lib/me";
import TabBar from "../TabBar";

function ProfileInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [igMsg, setIgMsg] = useState("");

  useEffect(() => {
    const ig = params.get("ig");
    if (ig === "done") setIgMsg("Instagram connected! Your follower count is now live.");
    if (ig === "notready") setIgMsg("Instagram verification isn't switched on yet — your Meta app needs approval first. Everything else works.");
    (async () => {
      const res = await loadMe(router);
      if (res) { setMe(res); setLoading(false); }
    })();
  }, []);

  const signOut = async () => { await me.supabase.auth.signOut(); router.replace("/"); };

  if (loading) return <main style={{ minHeight: "100dvh", background: "var(--cream)" }} />;

  const p = me.profile;
  const isCreator = p.role === "creator";

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "28px 22px 20px" }}>

        {igMsg && (
          <div style={{ background: "var(--green)", color: "#173404", borderRadius: 16, padding: "12px 16px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{igMsg}</div>
        )}

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
          <div style={{ fontSize: 24, fontWeight: 800, color: "#4B1528" }}>{p.full_name}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#993556", marginTop: 2 }}>
            {isCreator ? "@" + p.instagram_handle : p.company_name} · {p.city}
          </div>
          {isCreator && (p.instagram_connected
            ? <span style={{ display: "inline-block", marginTop: 10, background: "#173404", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 14 }}>✓ Verified</span>
            : <span style={{ display: "inline-block", marginTop: 10, background: "#fff", color: "#993556", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 14 }}>Not yet verified</span>)}
        </div>

        {isCreator && !p.instagram_connected && (
          <a href="/api/instagram/connect" className="pressable" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#E1306C", color: "#fff", borderRadius: 22, padding: "15px", fontSize: 15, fontWeight: 800, textDecoration: "none", marginBottom: 16 }}>
            ◎ Verify with Instagram
          </a>
        )}

        <div style={{ background: "#fff", borderRadius: 22, padding: 8, border: "1.5px solid #efe7d6", marginBottom: 16 }}>
          {(isCreator
            ? [
                { k: "Niche", v: p.niche },
                { k: "Followers", v: p.instagram_connected ? fmtFollowers(p.followers) : "Verify to show" },
                { k: "Rate per post", v: inr(p.rate_per_post) },
                { k: "City", v: p.city },
              ]
            : [
                { k: "Company", v: p.company_name },
                { k: "Looking for", v: p.niche },
                { k: "City", v: p.city },
              ]
          ).map((row, i, arr) => (
            <div key={row.k} style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", borderBottom: i < arr.length - 1 ? "1.5px solid #f4eede" : "none" }}>
              <span style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600 }}>{row.k}</span>
              <span style={{ fontSize: 15, color: "var(--ink)", fontWeight: 700 }}>{row.v}</span>
            </div>
          ))}
        </div>

        {p.is_admin && (
          <button onClick={() => router.push("/admin")} className="pressable" style={{ width: "100%", background: "var(--coral)", color: "#4A1B0C", border: "none", borderRadius: 22, padding: "15px", fontSize: 15, fontWeight: 800, marginBottom: 10 }}>
            🛠 Admin panel
          </button>
        )}

        <button onClick={() => router.push("/app/onboarding?role=" + p.role)} className="pressable" style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 22, padding: "15px", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Edit profile</button>
        <button onClick={signOut} className="pressable" style={{ width: "100%", background: "#fff", color: "var(--muted)", border: "1.5px solid #efe7d6", borderRadius: 22, padding: "15px", fontSize: 15, fontWeight: 700 }}>Sign out</button>
      </div>
      <TabBar />
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100dvh", background: "var(--cream)" }} />}>
      <ProfileInner />
    </Suspense>
  );
}
