"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadMe, inr } from "@/lib/me";
import TabBar from "../TabBar";

// Managed-model status flow
const STEPS = ["requested", "quoted", "confirmed", "completed"];
const STATUS_LABEL = {
  requested: "Requested", quoted: "Quote sent", confirmed: "Confirmed",
  in_progress: "In progress", completed: "Completed", cancelled: "Cancelled",
};
const STATUS_COLOR = {
  requested: "var(--yellow)", quoted: "var(--blue)", confirmed: "var(--green)",
  in_progress: "var(--blue)", completed: "var(--green)", cancelled: "#e0d8c8",
};

export default function Deals() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [others, setOthers] = useState({});
  const [loading, setLoading] = useState(true);
  const [quoteFor, setQuoteFor] = useState(null);

  const load = async () => {
    const res = await loadMe(router);
    if (!res) return;
    setMe(res);
    const isCreator = res.profile.role === "creator";
    const col = isCreator ? "creator_id" : "brand_id";
    const { data } = await res.supabase.from("collaborations").select("*").eq(col, res.profile.id).order("updated_at", { ascending: false });
    const list = data || [];
    setRows(list);
    const otherIds = [...new Set(list.map((d) => isCreator ? d.brand_id : d.creator_id))];
    if (otherIds.length) {
      const { data: profs } = await res.supabase.from("profiles").select("id, full_name, company_name").in("id", otherIds);
      const map = {}; (profs || []).forEach((p) => { map[p.id] = p; });
      setOthers(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const isCreator = me?.profile?.role === "creator";

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)", paddingBottom: 80 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>Collaborations</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, margin: "0 0 20px" }}>Our team coordinates every collaboration with you.</p>

        {loading ? (
          <p style={{ color: "var(--muted)", fontWeight: 600 }}>Loading…</p>
        ) : rows.length === 0 ? (
          <Empty isCreator={isCreator} />
        ) : (
          rows.map((d) => {
            const other = others[isCreator ? d.brand_id : d.creator_id] || {};
            const otherName = other.company_name || other.full_name || "—";
            return (
              <div key={d.id} style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #efe7d6", padding: 18, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{d.title || "Collaboration"}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{isCreator ? "From" : "With"} {otherName}</div>
                  </div>
                  <span style={{ background: STATUS_COLOR[d.status] || "#e0d8c8", color: "#1c1c1c", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 12, whiteSpace: "nowrap" }}>{STATUS_LABEL[d.status] || d.status}</span>
                </div>

                {d.brief && <p style={{ fontSize: 13.5, color: "#3a352e", fontWeight: 500, lineHeight: 1.5, margin: "10px 0 0" }}>{d.brief}</p>}
                {d.deliverables && <p style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, margin: "6px 0 0" }}>Deliverables: {d.deliverables}</p>}

                {/* status tracker */}
                <Tracker status={d.status} />

                {/* creator's quote shown once given */}
                {d.quote_amount != null && (
                  <div style={{ background: "#FBF3E4", borderRadius: 12, padding: "10px 14px", marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>Your quote: {inr(d.quote_amount)}</div>
                    {d.quote_note && <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{d.quote_note}</div>}
                  </div>
                )}

                {/* creator can submit a quote while still 'requested' */}
                {isCreator && d.status === "requested" && (
                  <button onClick={() => setQuoteFor(d)} className="pressable" style={{ width: "100%", marginTop: 14, background: "var(--ink)", color: "#fff", border: "none", borderRadius: 22, padding: "13px", fontSize: 14, fontWeight: 800 }}>
                    Send your quotation
                  </button>
                )}

                <p style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600, margin: "12px 0 0" }}>
                  Our team is coordinating this — they&apos;ll reach out with next steps.
                </p>
              </div>
            );
          })
        )}
      </div>

      {quoteFor && <QuoteModal me={me} collab={quoteFor} onClose={() => setQuoteFor(null)} onDone={() => { setQuoteFor(null); load(); }} />}
      <TabBar active="deals" />
    </main>
  );
}

function Tracker({ status }) {
  if (status === "cancelled") return null;
  const idx = STEPS.indexOf(status === "in_progress" ? "confirmed" : status);
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "0 0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: i <= idx ? "var(--green)" : "#e8dfcc" }} />
            <span style={{ fontSize: 9.5, fontWeight: 700, color: i <= idx ? "var(--ink)" : "var(--faint)", whiteSpace: "nowrap" }}>{STATUS_LABEL[s]}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < idx ? "var(--green)" : "#e8dfcc", margin: "0 4px", marginBottom: 14 }} />}
        </div>
      ))}
    </div>
  );
}

function QuoteModal({ me, collab, onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!amount) return;
    setBusy(true);
    const { error } = await me.supabase.from("collaborations").update({
      quote_amount: Number(amount), quote_note: note.trim(),
      quoted_at: new Date().toISOString(), status: "quoted", updated_at: new Date().toISOString(),
    }).eq("id", collab.id);
    if (error) { setBusy(false); alert("Couldn't send: " + error.message); return; }
    // notify the team
    const { data: admins } = await me.supabase.from("profiles").select("id").eq("is_admin", true);
    if (admins?.length) {
      await me.supabase.from("notifications").insert(admins.map((a) => ({
        user_id: a.id, kind: "offer", text: `${me.profile.full_name} sent a quotation (${inr(Number(amount))}) — review & push to brand.`, link: "/admin/collabs",
      })));
    }
    setBusy(false);
    onDone();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "var(--cream)", borderRadius: "28px 28px 0 0", padding: "24px 22px calc(24px + env(safe-area-inset-bottom))" }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: "#d8cfbc", margin: "0 auto 18px" }} />
        <h2 style={{ fontSize: 21, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>Send your quotation</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, lineHeight: 1.5, margin: "0 0 16px" }}>Our team reviews this and shares it with the brand. You can include what&apos;s covered.</p>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 18, top: 16, fontSize: 16, fontWeight: 700, color: "var(--faint)" }}>&#8377;</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Your price" style={{ ...mInput, paddingLeft: 34 }} />
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's included (e.g. 1 reel + 2 stories, 1 revision)" rows={3} style={{ ...mInput, resize: "none" }} />
        <button onClick={submit} disabled={busy || !amount} className="pressable" style={{ width: "100%", background: amount ? "var(--ink)" : "#d8cfbc", color: "#fff", border: "none", borderRadius: 28, padding: "16px", fontSize: 16, fontWeight: 800, marginTop: 4 }}>
          {busy ? "Sending…" : "Submit quotation"}
        </button>
      </div>
    </div>
  );
}

function Empty({ isCreator }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", background: "#fff", borderRadius: 18, border: "1.5px solid #efe7d6" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>No collaborations yet</div>
      <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, marginTop: 6, lineHeight: 1.5 }}>
        {isCreator ? "When a brand requests a collaboration, it shows up here and you can send your quotation." : "Find a creator and request your first collaboration — our team takes it from there."}
      </p>
    </div>
  );
}

const mInput = { width: "100%", padding: "15px 18px", fontSize: 15, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 16, background: "#fff", color: "var(--ink)", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12 };
