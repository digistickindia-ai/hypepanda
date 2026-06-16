"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { loadMe, inr } from "@/lib/me";

export default function DealChat() {
  const router = useRouter();
  const { id } = useParams();
  const [me, setMe] = useState(null);
  const [deal, setDeal] = useState(null);
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { (async () => {
    const res = await loadMe(router);
    if (!res) return;
    setMe(res);

    const { data: d } = await res.supabase.from("deals").select("*").eq("id", id).single();
    if (!d) { router.replace("/app/deals"); return; }
    setDeal(d);

    const isCreator = res.profile.role === "creator";
    const otherId = isCreator ? d.business_id : d.creator_id;
    const { data: o } = await res.supabase.from("profiles").select("*").eq("id", otherId).single();
    setOther(o);

    const { data: msgs } = await res.supabase.from("messages").select("*").eq("deal_id", id).order("created_at");
    setMessages(msgs || []);
    setLoading(false);

    const channel = res.supabase.channel("deal-" + id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "deal_id=eq." + id },
        (payload) => setMessages((m) => m.find((x) => x.id === payload.new.id) ? m : [...m, payload.new]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "deals", filter: "id=eq." + id },
        (payload) => setDeal(payload.new))
      .subscribe();
    return () => res.supabase.removeChannel(channel);
  })(); }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const body = text.trim();
    setText("");
    await me.supabase.from("messages").insert({ deal_id: id, sender_id: me.profile.id, body });
    await me.supabase.from("notifications").insert({
      user_id: me.profile.role === "creator" ? deal.business_id : deal.creator_id,
      kind: "message", text: `New message about "${deal.title}"`, link: "/app/chat/" + id,
    });
  };

  const updateStatus = async (patch, notifyText) => {
    setBusy(true);
    await me.supabase.from("deals").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    const otherId = me.profile.role === "creator" ? deal.business_id : deal.creator_id;
    if (notifyText) await me.supabase.from("notifications").insert({ user_id: otherId, kind: "accepted", text: notifyText, link: "/app/chat/" + id });
    const { data: d } = await me.supabase.from("deals").select("*").eq("id", id).single();
    setDeal(d);
    setBusy(false);
  };

  const payNow = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dealId: id }) });
      const j = await r.json();
      if (j.payment_link) { window.location.href = j.payment_link; return; }
      alert(j.error || "Payment could not start. Make sure Cashfree keys are set.");
    } catch (e) { alert("Payment error: " + e.message); }
    setBusy(false);
  };

  if (loading) return <main style={{ minHeight: "100dvh", background: "var(--cream)" }} />;

  const isCreator = me.profile.role === "creator";
  const otherName = other?.company_name || other?.full_name || "—";

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      {/* header */}
      <div style={{ padding: "16px 18px", background: "#fff", borderBottom: "1.5px solid #efe7d6", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/app/deals")} style={{ fontSize: 20, color: "var(--ink)" }}>&#8592;</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{deal.title}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{isCreator ? "From" : "To"} {otherName} · {inr(deal.amount)}</div>
        </div>
      </div>

      {/* action bar */}
      <DealActions deal={deal} isCreator={isCreator} busy={busy} updateStatus={updateStatus} payNow={payNow} />

      {/* messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
        {deal.brief && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 14, border: "1.5px solid #efe7d6", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>The brief</div>
            <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.5 }}>{deal.brief}</div>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me.profile.id;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 8 }}>
              <div style={{ maxWidth: "75%", background: mine ? "var(--ink)" : "#fff", color: mine ? "#fff" : "var(--ink)", border: mine ? "none" : "1.5px solid #efe7d6", borderRadius: 18, padding: "10px 14px", fontSize: 15, fontWeight: 500, lineHeight: 1.4 }}>{m.body}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div style={{ padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", background: "#fff", borderTop: "1.5px solid #efe7d6", display: "flex", gap: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" style={{ flex: 1, padding: "12px 16px", fontSize: 15, fontWeight: 500, border: "2px solid #e8dfcc", borderRadius: 24, background: "var(--cream)", color: "var(--ink)", outline: "none", fontFamily: "inherit" }} />
        <button onClick={send} className="pressable" style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--ink)", color: "#fff", fontSize: 18, flexShrink: 0 }}>&#8593;</button>
      </div>
    </div>
  );
}

function DealActions({ deal, isCreator, busy, updateStatus, payNow }) {
  const Bar = ({ children, bg = "var(--yellow)" }) => (
    <div style={{ background: bg, padding: "12px 18px", display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>{children}</div>
  );
  const Btn = ({ label, onClick, dark }) => (
    <button onClick={onClick} disabled={busy} className="pressable" style={{ background: dark ? "var(--ink)" : "#fff", color: dark ? "#fff" : "var(--ink)", border: dark ? "none" : "2px solid var(--ink)", borderRadius: 22, padding: "10px 20px", fontSize: 14, fontWeight: 800 }}>{label}</button>
  );

  // CREATOR: pending offer -> accept/decline
  if (isCreator && deal.status === "pending")
    return <Bar><span style={{ fontSize: 14, fontWeight: 700, color: "#412402" }}>New offer!</span><Btn label="Decline" onClick={() => updateStatus({ status: "declined" }, "Offer declined")} /><Btn dark label="Accept" onClick={() => updateStatus({ status: "accepted" }, "Your offer was accepted!")} /></Bar>;

  // BUSINESS: accepted -> pay
  if (!isCreator && deal.status === "accepted" && deal.payment_status === "unpaid")
    return <Bar bg="var(--green)"><span style={{ fontSize: 14, fontWeight: 700, color: "#173404" }}>Accepted! Pay to start the collab.</span><Btn dark label={"Pay " + inr(deal.amount) + " →"} onClick={payNow} /></Bar>;

  // CREATOR: payment secured -> mark delivered
  if (isCreator && deal.payment_status === "secured" && deal.status !== "delivered" && deal.status !== "completed")
    return <Bar bg="var(--blue)"><span style={{ fontSize: 14, fontWeight: 700, color: "#042C53" }}>Payment secured. Create, then mark delivered.</span><Btn dark label="Mark delivered" onClick={() => updateStatus({ status: "delivered" }, "Creator marked the work delivered")} /></Bar>;

  // BUSINESS: delivered -> approve (HypePanda then pays out)
  if (!isCreator && deal.status === "delivered" && deal.payment_status === "secured")
    return <Bar bg="var(--pink)"><span style={{ fontSize: 14, fontWeight: 700, color: "#4B1528" }}>Delivered! Approve to release payout.</span><Btn dark label="Approve work" onClick={() => updateStatus({ status: "completed" }, "Work approved — your payout is being released")} /></Bar>;

  // payout pending (approved, HypePanda paying out)
  if (deal.status === "completed" && deal.payment_status === "secured")
    return <Bar bg="var(--yellow)"><span style={{ fontSize: 14, fontWeight: 700, color: "#412402" }}>{isCreator ? "Approved! Payment releasing soon." : "Approved — HypePanda is paying the creator."}</span></Bar>;

  if (deal.payment_status === "paid_out")
    return <Bar bg="var(--green)"><span style={{ fontSize: 14, fontWeight: 800, color: "#173404" }}>{isCreator ? "Paid out to you!" : "Deal complete — creator paid"}</span></Bar>;
  if (deal.status === "declined")
    return <Bar bg="#e0d8c8"><span style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>This offer was declined</span></Bar>;

  return null;
}
