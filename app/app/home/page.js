"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { loadMe, inr, fmtFollowers, NICHES } from "@/lib/me";
import Panda from "../../Panda";
import TabBar from "../TabBar";

function HomeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/app"); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile || !profile.onboarding_done) {
      const role = params.get("role") || "creator";
      router.replace("/app/onboarding?role=" + role);
      return;
    }
    if (profile.role === "creator" && !profile.showcase_done) {
      router.replace("/app/onboarding/showcase");
      return;
    }
    if (profile.suspended) { await supabase.auth.signOut(); router.replace("/?suspended=1"); return; }
    setMe({ user, profile, supabase });
    setLoading(false);
  })(); }, []);

  if (loading) return <Loader />;

  return me.profile.role === "creator"
    ? <CreatorHome me={me} router={router} />
    : <BusinessHome me={me} router={router} />;
}

export default function Home() {
  return (
    <Suspense fallback={<Loader />}>
      <HomeInner />
    </Suspense>
  );
}

function Loader() {
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

/* ---------------- CREATOR HOME ---------------- */
function CreatorHome({ me, router }) {
  const p = me.profile;
  const first = (p.full_name || "there").split(" ")[0];
  const [dealCount, setDealCount] = useState(null);

  useEffect(() => { (async () => {
    const { count } = await me.supabase.from("deals").select("*", { count: "exact", head: true }).eq("creator_id", p.id);
    setDealCount(count || 0);
  })(); }, []);

  return (
    <Shell>
      <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, margin: 0 }}>Hey {first} 👋</p>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", margin: "4px 0 24px" }}>Your panda HQ</h1>

      <div style={{ background: "var(--coral)", borderRadius: 24, padding: 22, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#712B13", textTransform: "uppercase", letterSpacing: "0.5px" }}>Profile strength</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#4A1B0C", margin: "6px 0 12px" }}>{p.instagram_connected ? "100%" : "80%"}</div>
        {!p.instagram_connected && (
          <button onClick={() => router.push("/app/profile")} className="pressable" style={{ background: "#4A1B0C", color: "#fff", border: "none", borderRadius: 20, padding: "10px 18px", fontSize: 14, fontWeight: 700 }}>
            Verify Instagram →
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Stat big={p.niche} small="your niche" />
        <Stat big={inr(p.rate_per_post)} small="per post" />
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Stat big={p.instagram_connected ? fmtFollowers(p.followers) : "—"} small="followers" />
        <Stat big={dealCount == null ? "…" : String(dealCount)} small="total offers" />
      </div>

      <div onClick={() => router.push("/app/deals")} style={{ background: "#fff", borderRadius: 24, padding: 22, border: "1.5px solid #efe7d6", textAlign: "center", cursor: "pointer" }}>
        <div className="blobSlow" style={{ marginBottom: 8 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ margin: "0 auto" }}>
            <circle cx="32" cy="32" r="26" fill="var(--blue)" />
            <circle cx="25" cy="28" r="5" fill="#fff" /><circle cx="26" cy="29" r="2.5" fill="var(--ink)" />
            <circle cx="39" cy="28" r="5" fill="#fff" /><circle cx="40" cy="29" r="2.5" fill="var(--ink)" />
            <path d="M25 40 Q32 47 41 39" stroke="var(--ink)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{dealCount ? "View your offers" : "No offers yet"}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>{dealCount ? "Tap to see brand collab offers." : "When brands send collab offers, they show up in Deals."}</div>
      </div>
    </Shell>
  );
}

/* ---------------- BUSINESS HOME (search) ---------------- */
function BusinessHome({ me, router }) {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeNiche, setActiveNiche] = useState("");

  useEffect(() => { (async () => {
    const { data } = await me.supabase.from("profiles").select("*").eq("role", "creator").eq("onboarding_done", true).order("created_at", { ascending: false });
    const list = (data || []).filter((c) => !c.suspended);
    const proActive = (c) => c.is_pro && c.pro_until && new Date(c.pro_until).getTime() > Date.now();
    list.sort((a, b) => (proActive(b) ? 1 : 0) - (proActive(a) ? 1 : 0));
    setCreators(list);
    setLoading(false);
  })(); }, []);

  const filtered = creators.filter((c) => {
    const matchQ = !q || (c.full_name || "").toLowerCase().includes(q.toLowerCase()) || (c.instagram_handle || "").toLowerCase().includes(q.toLowerCase()) || (c.city || "").toLowerCase().includes(q.toLowerCase());
    const matchN = !activeNiche || c.niche === activeNiche;
    return matchQ && matchN;
  });

  return (
    <Shell>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", margin: "8px 0 16px", lineHeight: 1.1 }}>Find your<br />perfect creators</h1>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, handle, city…" style={{ width: "100%", padding: "14px 18px", fontSize: 15, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 18, background: "#fff", color: "var(--ink)", outline: "none", fontFamily: "inherit", marginBottom: 14 }} />

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14, marginLeft: -2 }}>
        <Pill label="All" active={!activeNiche} onClick={() => setActiveNiche("")} />
        {NICHES.map((n) => <Pill key={n} label={n} active={activeNiche === n} onClick={() => setActiveNiche(activeNiche === n ? "" : n)} />)}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", fontWeight: 600, textAlign: "center", marginTop: 30 }}>Loading creators…</p>
      ) : filtered.length === 0 ? (
        <EmptyCreators hasAny={creators.length > 0} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
          {filtered.map((c) => <CreatorCard key={c.id} c={c} onClick={() => router.push("/app/creator/" + c.id)} />)}
        </div>
      )}
    </Shell>
  );
}

function CreatorCard({ c, onClick }) {
  const colors = ["var(--coral)", "var(--blue)", "var(--pink)", "var(--yellow)", "var(--green)"];
  const col = colors[(c.full_name || "x").charCodeAt(0) % colors.length];
  const initials = (c.full_name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const proActive = c.is_pro && c.pro_until && new Date(c.pro_until).getTime() > Date.now();
  return (
    <div onClick={onClick} className="pressable" style={{ background: "#fff", borderRadius: 20, padding: 14, border: proActive ? "2px solid var(--yellow)" : "1.5px solid #efe7d6", cursor: "pointer" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: 14, background: col, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: "#fff" }}>{initials}</span>
        {proActive && <span style={{ position: "absolute", top: 8, left: 8, background: "var(--yellow)", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: "#412402" }}>★ PRO</span>}
        {c.instagram_connected && <span style={{ position: "absolute", top: 8, right: 8, background: "#fff", borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 800, color: "#173404" }}>✓</span>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.full_name}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>{c.niche} · {c.city}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--coral)" }}>{inr(c.rate_per_post)}<span style={{ color: "var(--faint)", fontWeight: 600 }}>/post</span></div>
    </div>
  );
}

function EmptyCreators({ hasAny }) {
  return (
    <div style={{ textAlign: "center", marginTop: 36 }}>
      <div style={{ marginBottom: 12 }}><Panda size={72} style={{ margin: "0 auto", display: "block" }} /></div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{hasAny ? "No matches" : "No creators yet"}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>{hasAny ? "Try a different filter." : "As creators join HypePanda, they'll appear here."}</div>
    </div>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flexShrink: 0, padding: "9px 16px", borderRadius: 20, fontSize: 14, fontWeight: 700, border: active ? "2px solid var(--ink)" : "2px solid #e8dfcc", background: active ? "var(--ink)" : "#fff", color: active ? "#fff" : "var(--ink)" }}>{label}</button>
  );
}


function Stat({ big, small }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 20, padding: 18, border: "1.5px solid #efe7d6" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{big}</div>
      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{small}</div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{ height: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "28px 22px 20px", overflowY: "auto" }}>{children}</div>
      <TabBar />
    </div>
  );
}
