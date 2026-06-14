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

/* ---------------- BUSINESS HOME (TikTok-style feed) ---------------- */
function BusinessHome({ me, router }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const { data: vids } = await me.supabase
      .from("portfolio").select("*").eq("status", "approved").order("created_at", { ascending: false });
    const list = vids || [];
    const ids = [...new Set(list.map((v) => v.creator_id))];
    let creators = {};
    if (ids.length) {
      const { data: profs } = await me.supabase.from("profiles").select("*").in("id", ids);
      (profs || []).forEach((p) => { creators[p.id] = p; });
    }
    const feed = list
      .map((v) => ({ ...v, creator: creators[v.creator_id] }))
      .filter((v) => v.creator && !v.creator.suspended);
    setItems(feed);
    setLoading(false);
  })(); }, []);

  if (loading) return <Loader />;

  if (items.length === 0) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
          <Panda size={90} />
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginTop: 12 }}>No creators yet</div>
          <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>As creators post approved videos, they&apos;ll show up here to discover.</div>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, overflowY: "auto", scrollSnapType: "y mandatory" }}>
        {items.map((item) => (
          <FeedCard key={item.id} item={item} router={router} />
        ))}
      </div>
      <TabBar />
    </div>
  );
}

function FeedCard({ item, router }) {
  const c = item.creator;
  return (
    <div style={{ position: "relative", height: "calc(100dvh - 66px)", scrollSnapAlign: "start", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <video src={item.video_url} controls playsInline loop style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />

      {/* gradient + info overlay */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "60px 18px 22px", background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)", pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div style={{ pointerEvents: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{c.full_name}</span>
              {c.instagram_connected && <span style={{ background: "#fff", color: "#173404", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>✓</span>}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600, marginTop: 3 }}>
              📍 {c.city || "India"} · {c.niche}
            </div>
            {c.instagram_connected && c.followers != null && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginTop: 2 }}>{fmtFollowers(c.followers)} followers · {inr(c.rate_per_post)}/post</div>
            )}
          </div>
          <button onClick={() => router.push("/app/creator/" + c.id)} className="pressable" style={{ pointerEvents: "auto", background: "var(--coral)", color: "#4A1B0C", border: "none", borderRadius: 26, padding: "13px 26px", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
            Hire →
          </button>
        </div>
      </div>
    </div>
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
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "28px 22px 20px" }}>{children}</div>
      <TabBar />
    </div>
  );
}
