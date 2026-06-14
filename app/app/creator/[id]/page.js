"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { loadMe, inr, fmtFollowers, payout, commissionAmount, DEFAULT_COMMISSION } from "@/lib/me";

export default function CreatorDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [me, setMe] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);

  useEffect(() => { (async () => {
    const res = await loadMe(router);
    if (!res) return;
    setMe(res);
    const { data } = await res.supabase.from("profiles").select("*").eq("id", id).single();
    setCreator(data);
    setLoading(false);
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
          <div style={{ width: 92, height: 92, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: col }}>{initials}</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{creator.full_name}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>@{creator.instagram_handle} · {creator.city}</div>
          {creator.instagram_connected
            ? <span style={{ display: "inline-block", marginTop: 12, background: "#fff", color: "#173404", fontSize: 12, fontWeight: 800, padding: "5px 14px", borderRadius: 14 }}>✓ Verified creator</span>
            : <span style={{ display: "inline-block", marginTop: 12, background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 14 }}>Not yet verified</span>}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <Stat big={creator.instagram_connected ? fmtFollowers(creator.followers) : "—"} small="followers" />
          <Stat big={creator.niche} small="niche" />
          <Stat big={inr(creator.rate_per_post)} small="per post" />
        </div>

        {creator.bio && (
          <div style={{ background: "#fff", borderRadius: 20, padding: 18, border: "1.5px solid #efe7d6", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>About</div>
            <div style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.5 }}>{creator.bio}</div>
          </div>
        )}
      </div>

      {isBusiness && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", padding: "16px 22px calc(16px + env(safe-area-inset-bottom))", background: "var(--cream)", borderTop: "1.5px solid #efe7d6" }}>
          <button onClick={() => setShowOffer(true)} className="pressable" style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 28, padding: "16px", fontSize: 16, fontWeight: 800 }}>
            Send collab offer
          </button>
        </div>
      )}

      {showOffer && <OfferModal me={me} creator={creator} onClose={() => setShowOffer(false)} router={router} />}
    </div>
  );
}

function OfferModal({ me, creator, onClose, router }) {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [amount, setAmount] = useState(creator.rate_per_post || "");
  const [sending, setSending] = useState(false);

  const gross = Number(amount) || 0;
  const creatorGets = payout(gross);
  const fee = commissionAmount(gross);

  const send = async () => {
    if (!title.trim() || !amount) return;
    setSending(true);
    const { data: deal, error } = await me.supabase.from("deals").insert({
      business_id: me.profile.id, creator_id: creator.id,
      title: title.trim(), brief: brief.trim(), amount: gross,
      commission_pct: DEFAULT_COMMISSION, payout_amount: creatorGets,
      status: "pending",
    }).select().single();
    if (error) { setSending(false); alert("Couldn't send: " + error.message); return; }
    await me.supabase.from("notifications").insert({
      user_id: creator.id, kind: "offer",
      text: `${me.profile.company_name || me.profile.full_name} sent you a collab offer`,
      link: "/app/deals",
    });
    setSending(false);
    router.push("/app/chat/" + deal.id);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "var(--cream)", borderRadius: "28px 28px 0 0", padding: "24px 22px calc(24px + env(safe-area-inset-bottom))" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "#d8cfbc", margin: "0 auto 18px" }} />
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", margin: "0 0 16px" }}>Offer to {creator.full_name.split(" ")[0]}</h2>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Campaign title (e.g. Diwali reel)" style={modalInput} />
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="What do you want them to make?" rows={3} style={{ ...modalInput, resize: "none" }} />
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 18, top: 15, fontSize: 16, fontWeight: 700, color: "var(--faint)" }}>&#8377;</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ ...modalInput, paddingLeft: 34 }} />
        </div>

        {gross > 0 && (
          <div style={{ background: "#fff", border: "1.5px solid #efe7d6", borderRadius: 16, padding: 14, marginBottom: 14 }}>
            <Row label="You pay" value={inr(gross)} />
            <Row label={"HypePanda fee (" + DEFAULT_COMMISSION + "%)"} value={"− " + inr(fee)} muted />
            <div style={{ borderTop: "1.5px solid #f4eede", marginTop: 8, paddingTop: 8 }}>
              <Row label="Creator receives" value={inr(creatorGets)} bold />
            </div>
          </div>
        )}

        <button onClick={send} disabled={sending || !title.trim() || !amount} className="pressable" style={{
          width: "100%", background: title.trim() && amount ? "var(--ink)" : "#d8cfbc", color: "#fff", border: "none",
          borderRadius: 28, padding: "16px", fontSize: 16, fontWeight: 800, marginTop: 4,
        }}>{sending ? "Sending…" : "Send offer"}</button>
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
