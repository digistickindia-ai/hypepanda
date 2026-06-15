"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadMe, inr, fmtFollowers } from "@/lib/me";
import Panda from "../../Panda";
import TabBar from "../TabBar";

export default function Reels() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const res = await loadMe(router);
    if (!res) return;
    setMe(res);
    const { data: vids } = await res.supabase.from("portfolio").select("*").eq("status", "approved").order("created_at", { ascending: false });
    const list = vids || [];
    const ids = [...new Set(list.map((v) => v.creator_id))];
    let creators = {};
    if (ids.length) {
      const { data: profs } = await res.supabase.from("profiles").select("*").in("id", ids);
      (profs || []).forEach((p) => { creators[p.id] = p; });
    }
    const feed = list.map((v) => ({ ...v, creator: creators[v.creator_id] })).filter((v) => v.creator && !v.creator.suspended);
    const proActive = (c) => c.is_pro && c.pro_until && new Date(c.pro_until).getTime() > Date.now();
    feed.sort((a, b) => (proActive(b.creator) ? 1 : 0) - (proActive(a.creator) ? 1 : 0));
    setItems(feed);
    setLoading(false);
  })(); }, []);

  if (loading) {
    return <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}><Panda size={80} /></div>;
  }

  const isBusiness = me.profile.role !== "creator";

  return (
    <div style={{ height: "100dvh", background: "#000", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", overflow: "hidden" }}>
      <style>{`.reelscroll::-webkit-scrollbar{display:none}`}</style>
      {items.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center", background: "var(--cream)" }}>
          <Panda size={90} />
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginTop: 12 }}>No reels yet</div>
          <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>Approved creator reels show up here to discover.</div>
        </div>
      ) : (
        <div className="reelscroll" style={{ flex: 1, overflowY: "auto", scrollSnapType: "y mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {items.map((item) => (
            <ReelCard key={item.id} item={item} router={router} isBusiness={isBusiness} />
          ))}
        </div>
      )}
      <TabBar />
    </div>
  );
}

function ReelCard({ item, router, isBusiness }) {
  const c = item.creator;
  const ref = useRef(null);
  const vidRef = useRef(null);

  useEffect(() => {
    const el = ref.current, vid = vidRef.current;
    if (!el || !vid) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", height: "calc(100dvh - 71px)", scrollSnapAlign: "start", scrollSnapStop: "always", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <video ref={vidRef} src={item.video_url} playsInline loop muted controls style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "60px 18px 22px", background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)", pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div style={{ pointerEvents: "auto", flex: 1, minWidth: 0 }} onClick={() => router.push("/app/creator/" + c.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{c.full_name}</span>
              {c.instagram_connected && <span style={{ background: "#fff", color: "#173404", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>✓</span>}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600, marginTop: 3 }}>📍 {c.city || "India"} · {c.niche}</div>
            {c.instagram_connected && c.followers != null && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginTop: 2 }}>{fmtFollowers(c.followers)} followers · {inr(c.rate_per_post)}/post</div>
            )}
          </div>
          {isBusiness && (
            <button onClick={() => router.push("/app/creator/" + c.id)} className="pressable" style={{ pointerEvents: "auto", background: "var(--coral)", color: "#4A1B0C", border: "none", borderRadius: 26, padding: "13px 26px", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>Hire →</button>
          )}
        </div>
      </div>
    </div>
  );
}
