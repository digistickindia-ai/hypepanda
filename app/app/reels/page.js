"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadMe, inr, fmtFollowers } from "@/lib/me";
import Panda from "../../Panda";
import Icon from "../../Icon";
import TabBar from "../TabBar";

export default function Reels() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState(null);

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
    <div style={{ height: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "22px 16px 8px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", margin: 0 }}>Discover reels</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, margin: "2px 0 0" }}>Tap any reel to watch</p>
        </div>

        {items.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 30px", textAlign: "center" }}>
            <Panda size={90} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginTop: 12 }}>No reels yet</div>
            <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>Approved creator reels show up here.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "8px 16px 24px" }}>
            {items.map((item, i) => (
              <GridTile key={item.id} item={item} onClick={() => setOpenIdx(i)} />
            ))}
          </div>
        )}
      </div>

      <TabBar />

      {openIdx != null && (
        <Player
          items={items}
          startIdx={openIdx}
          isBusiness={isBusiness}
          onClose={() => setOpenIdx(null)}
          onHire={(cid) => { setOpenIdx(null); router.push("/app/creator/" + cid); }}
        />
      )}
    </div>
  );
}

/* ---- grid tile: muted autoplay preview ---- */
function GridTile({ item, onClick }) {
  const ref = useRef(null);
  const vidRef = useRef(null);
  const c = item.creator;
  const proActive = c.is_pro && c.pro_until && new Date(c.pro_until).getTime() > Date.now();

  useEffect(() => {
    const el = ref.current, vid = vidRef.current;
    if (!el || !vid) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) vid.play().catch(() => {}); else vid.pause(); },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} onClick={onClick} className="pressable" style={{ position: "relative", aspectRatio: "3/4", borderRadius: 16, overflow: "hidden", background: "#000", cursor: "pointer" }}>
      <video ref={vidRef} src={item.video_url} muted loop playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {/* play badge */}
      <div style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="play" size={13} color="#fff" fill="#fff" strokeWidth={1} />
      </div>
      {proActive && (
        <div style={{ position: "absolute", top: 8, left: 8, background: "var(--yellow)", borderRadius: 8, padding: "2px 7px", display: "flex", alignItems: "center", gap: 3 }}>
          <Icon name="star" size={10} color="#412402" fill="#412402" strokeWidth={1} />
          <span style={{ fontSize: 9, fontWeight: 800, color: "#412402" }}>PRO</span>
        </div>
      )}
      {/* bottom gradient + name */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "26px 10px 8px", background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.full_name}</span>
          {c.verification_status === "verified" && <Icon name="check" size={11} color="#fff" strokeWidth={3} />}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.niche}</div>
      </div>
    </div>
  );
}

/* ---- fullscreen player overlay ---- */
function Player({ items, startIdx, isBusiness, onClose, onHire }) {
  const [idx, setIdx] = useState(startIdx);
  const item = items[idx];
  const c = item.creator;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 100, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      {/* top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(12px + env(safe-area-inset-top)) 16px 12px" }}>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>&#8249;</button>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{idx + 1} / {items.length}</div>
      </div>

      <video key={item.id} src={item.video_url} controls autoPlay playsInline loop style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />

      {/* info + actions */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "60px 18px calc(20px + env(safe-area-inset-bottom))", background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{c.full_name}</span>
              {c.verification_status === "verified" && <Icon name="check" size={16} color="#fff" strokeWidth={3} />}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600, marginTop: 3 }}>{c.city || "India"} · {c.niche}</div>
            {c.followers != null && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginTop: 2 }}>{fmtFollowers(c.followers)} followers</div>
            )}
          </div>
          {isBusiness && (
            <button onClick={() => onHire(c.id)} className="pressable" style={{ background: "var(--coral)", color: "#4A1B0C", border: "none", borderRadius: 26, padding: "13px 26px", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>Hire</button>
          )}
        </div>

        {/* prev / next */}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} style={navBtn(idx === 0)}>Previous</button>
          <button onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))} disabled={idx === items.length - 1} style={navBtn(idx === items.length - 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}

function navBtn(disabled) {
  return { flex: 1, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "11px", fontSize: 14, fontWeight: 700, opacity: disabled ? 0.35 : 1, cursor: disabled ? "default" : "pointer" };
}
