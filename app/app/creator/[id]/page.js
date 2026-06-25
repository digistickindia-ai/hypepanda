"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { loadMe, inr, fmtFollowers, payout, commissionAmount, commissionFor, isProActive, DEFAULT_COMMISSION } from "@/lib/me";

export default function CreatorDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [me, setMe] = useState(null);
  const [creator, setCreator] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);

  useEffect(() => { (async () => {
    const res = await loadMe(router);
    if (!res) return;
    setMe(res);
    const { data } = await res.supabase.from("profiles").select("*").eq("id", id).single();
    setCreator(data);
    const { data: vids } = await res.supabase.from("portfolio").select("*").eq("creator_id", id).eq("status", "approved").order("created_at");
    setVideos(vids || []);
    setLoading(false);
    // Log a profile view (only when a business views someone else's profile)
    if (res.profile.role !== "creator" && res.profile.id !== id) {
      res.supabase.from("profile_views_log").insert({ creator_id: id, viewer_id: res.profile.id }).then(() => {});
    }
  })(); }, []);

  if (loading) return <main style={{ minHeight: "100dvh", background: "var(--cream)" }} />;
  if (!creator) return <main style={{ minHeight: "100dvh", background: "var(--cream)", padding: 40, textAlign: "center" }}><p style={{ color: "var(--muted)" }}>Creator not found.</p></main>;

  const isBusiness = me.profile.role !== "creator";
  const colors = ["var(--coral)", "var(--blue)", "var(--pink)", "var(--yellow)", "var(--green)"];
  const col = colors[(creator.full_name || "x").charCodeAt(0) % colors.length];
  const initials = (creator.full_name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ padding: "20px 22px 120px" }}>
        <button onClick={() => router.back()} style={{ fontSize: 15, fontWeight: 700, color: "var(--muted)", marginBottom: 16 }}>&#8592; Back</button>

        <div style={{ background: col, borderRadius: 28, padding: "32px 24px", textAlign: "center", marginBottom: 16 }}>
          <div style={{ width: 92, height: 92, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", overflow: "hidden" }}>
            {creator.avatar_url
              ? <img src={creator.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 36, fontWeight: 800, color: col }}>{initials}</span>}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{creator.full_name}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
            <a href={"https://instagram.com/" + creator.instagram_handle} target="_blank" rel="noopener noreferrer" style={{ color: "#fff", textDecoration: "underline", textUnderlineOffset: 2 }}>@{creator.instagram_handle}</a>
            {creator.verification_status === "verified"
              ? <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700 }}>✓ verified</span>
              : <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 600, opacity: 0.8 }}>· self-reported</span>}
            {" "}· {creator.city}
          </div>
          {creator.verification_status === "verified"
            ? <span style={{ display: "inline-block", marginTop: 12, background: "#fff", color: "#173404", fontSize: 12, fontWeight: 800, padding: "5px 14px", borderRadius: 14 }}>Verified creator</span>
            : <span style={{ display: "inline-block", marginTop: 12, background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 14 }}>Not yet verified</span>}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <Stat big={creator.followers != null ? fmtFollowers(creator.followers) : "—"} small="followers" />
          <Stat big={creator.niche} small="niche" />
          <Stat big={creator.city || "—"} small="city" />
        </div>

        {creator.bio && (
          <div style={{ background: "#fff", borderRadius: 20, padding: 18, border: "1.5px solid #efe7d6", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>About</div>
            <div style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.5 }}>{creator.bio}</div>
          </div>
        )}

        {videos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 10 }}>Best work</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {videos.map((v) => (
                <div key={v.id} style={{ background: "#fff", borderRadius: 18, padding: 10, border: "1.5px solid #efe7d6" }}>
                  <video src={v.video_url} controls playsInline style={{ width: "100%", borderRadius: 12, background: "#000", maxHeight: 280 }} />
                  {v.caption && <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 8, padding: "0 4px" }}>{v.caption}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isBusiness && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", padding: "16px 22px calc(16px + env(safe-area-inset-bottom))", background: "var(--cream)", borderTop: "1.5px solid #efe7d6" }}>
          <button onClick={() => setShowOffer(true)} className="pressable" style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 28, padding: "16px", fontSize: 16, fontWeight: 800 }}>
            Request collaboration
          </button>
        </div>
      )}

      {showOffer && <OfferModal me={me} creator={creator} onClose={() => setShowOffer(false)} router={router} />}
    </div>
  );
}

function OfferModal({ me, creator, onClose, router }) {
  const [title, setTitle] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [brief, setBrief] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !brief.trim()) return;
    setSending(true);
    const { data: collab, error } = await me.supabase.from("collaborations").insert({
      brand_id: me.profile.id, creator_id: creator.id,
      title: title.trim(), brief: brief.trim(), deliverables: deliverables.trim(),
      budget_range: budget.trim(), timeline: timeline.trim(),
      status: "requested",
    }).select().single();
    if (error) { setSending(false); alert("Couldn't send: " + error.message + "\n\nIf this mentions a column or policy, run collaborations-flow-patch.sql in Supabase."); return; }

    // notify the creator they've received a collab request (in-app + email)
    await me.supabase.from("notifications").insert({
      user_id: creator.id, kind: "offer",
      text: `You've received a collaboration request via HypePanda. Tap to send your quotation.`,
      link: "/app/deals",
    });
    fetch("/api/send-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_user_id: creator.id, subject: "New collaboration request · HypePanda", heading: "You've got a collaboration request", message: "A brand wants to work with you. Our team is coordinating it — open HypePanda to review the brief and send your quotation.", ctaText: "View request", ctaLink: "https://www.hypepanda.in/app/deals" }),
    }).catch(() => {});
    // notify the HypePanda team (all admins) so they can coordinate
    const { data: admins } = await me.supabase.from("profiles").select("id").eq("is_admin", true);
    if (admins && admins.length) {
      await me.supabase.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.id, kind: "offer",
          text: `New collab request: ${me.profile.company_name || me.profile.full_name} → ${creator.full_name}`,
          link: "/admin/collabs",
        }))
      );
    }
    setSending(false);
    onClose();
    router.push("/app/deals?requested=1");
  };

  const ready = title.trim() && brief.trim();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "92dvh", overflowY: "auto", background: "var(--cream)", borderRadius: "28px 28px 0 0", padding: "24px 22px calc(24px + env(safe-area-inset-bottom))" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "#d8cfbc", margin: "0 auto 18px" }} />
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>Request a collaboration with {creator.full_name.split(" ")[0]}</h2>
        <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.5, margin: "0 0 18px" }}>Share what you need. Our team coordinates everything and gets you a quote — you don&apos;t deal with pricing here.</p>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Campaign title (e.g. Diwali reel)" style={modalInput} />
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="What do you want them to make?" rows={3} style={{ ...modalInput, resize: "none" }} />
        <textarea value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="Deliverables (e.g. 1 reel + 2 stories)" rows={2} style={{ ...modalInput, resize: "none" }} />
        <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget range (optional, e.g. ₹10k–15k)" style={modalInput} />
        <input value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="Timeline / deadline (optional)" style={modalInput} />

        <button onClick={send} disabled={sending || !ready} className="pressable" style={{
          width: "100%", background: ready ? "var(--ink)" : "#d8cfbc", color: "#fff", border: "none",
          borderRadius: 28, padding: "16px", fontSize: 16, fontWeight: 800, marginTop: 4,
        }}>{sending ? "Sending…" : "Send request"}</button>
      </div>
    </div>
  );
}

function Row({ label, value, muted, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
      <span style={{ fontSize: 14, fontWeight: bold ? 800 : 600, color: muted ? "var(--muted)" : "var(--ink)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: bold ? 800 : 700, color: muted ? "var(--muted)" : bold ? "var(--coral)" : "var(--ink)" }}>{value}</span>
    </div>
  );
}

const modalInput = {
  width: "100%", padding: "14px 18px", fontSize: 15, fontWeight: 600, border: "2px solid #e8dfcc",
  borderRadius: 16, background: "#fff", color: "var(--ink)", outline: "none", fontFamily: "inherit", marginBottom: 12,
};

function Stat({ big, small }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 18, padding: 14, border: "1.5px solid #efe7d6", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{big}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{small}</div>
    </div>
  );
}
