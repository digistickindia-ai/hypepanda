"use client";

import { useState, useEffect } from "react";
import AdminShell from "../AdminShell";
import { useAdmin } from "../useAdmin";
import { inr, payout, commissionAmount } from "@/lib/me";

export default function AdminPayouts() {
  const { loading, supabase } = useAdmin();
  const [deals, setDeals] = useState([]);
  const [profs, setProfs] = useState({});
  const [tab, setTab] = useState("topay");
  const [busy, setBusy] = useState(null);

  const load = async (sb) => {
    const { data } = await sb.from("deals").select("*").order("updated_at", { ascending: false });
    const list = data || [];
    setDeals(list);
    const ids = [...new Set(list.flatMap((d) => [d.business_id, d.creator_id]))];
    if (ids.length) {
      const { data: p } = await sb.from("profiles").select("id, full_name, company_name, instagram_handle").in("id", ids);
      const m = {}; (p || []).forEach((x) => { m[x.id] = x; }); setProfs(m);
    }
  };
  useEffect(() => { if (supabase) load(supabase); }, [supabase]);

  const markPaid = async (d) => {
    setBusy(d.id);
    await supabase.from("deals").update({ payment_status: "paid_out", paid_out_at: new Date().toISOString() }).eq("id", d.id);
    await supabase.from("notifications").insert({ user_id: d.creator_id, kind: "payment", text: `You've been paid ${inr(d.payout_amount || payout(d.amount))} for "${d.title}" 🎉`, link: "/app/deals" });
    await load(supabase);
    setBusy(null);
  };

  if (loading) return <AdminShell><p style={{ color: "var(--muted)", fontWeight: 600 }}>Loading…</p></AdminShell>;

  const toPay = deals.filter((d) => d.status === "completed" && d.payment_status === "secured");
  const active = deals.filter((d) => d.payment_status === "secured" && d.status !== "completed");
  const done = deals.filter((d) => d.payment_status === "paid_out");
  const rows = tab === "topay" ? toPay : tab === "active" ? active : done;

  const owed = toPay.reduce((s, d) => s + (d.payout_amount || payout(d.amount)), 0);

  return (
    <AdminShell>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>Payouts</h1>
      <p style={{ fontSize: 14, color: "var(--coral)", fontWeight: 800, margin: "0 0 18px" }}>{inr(owed)} to pay out</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Tab label={`To pay (${toPay.length})`} active={tab === "topay"} onClick={() => setTab("topay")} />
        <Tab label={`Active (${active.length})`} active={tab === "active"} onClick={() => setTab("active")} />
        <Tab label={`Paid (${done.length})`} active={tab === "done"} onClick={() => setTab("done")} />
      </div>

      {rows.length === 0 ? <p style={{ color: "var(--muted)", fontWeight: 600 }}>Nothing here.</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((d) => {
            const c = profs[d.creator_id] || {}, b = profs[d.business_id] || {};
            const gets = d.payout_amount || payout(d.amount);
            return (
              <div key={d.id} style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1.5px solid #efe7d6" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>{d.title}</div>
                <Line k="Business paid" v={inr(d.amount)} />
                <Line k="Your fee" v={inr(commissionAmount(d.amount, d.commission_pct || 10))} />
                <Line k="Pay creator" v={(c.full_name || "—") + (c.instagram_handle ? " @" + c.instagram_handle : "")} />
                <Line k="Amount" v={inr(gets)} bold />
                {tab === "topay" && (
                  <button onClick={() => markPaid(d)} disabled={busy === d.id} style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 14, padding: "12px", fontSize: 14, fontWeight: 800, marginTop: 10, cursor: "pointer" }}>
                    {busy === d.id ? "Marking…" : "Mark as paid " + inr(gets)}
                  </button>
                )}
                {tab === "done" && d.paid_out_at && <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 700, marginTop: 8 }}>✓ Paid {new Date(d.paid_out_at).toLocaleDateString("en-IN")}</div>}
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

function Tab({ label, active, onClick }) {
  return <button onClick={onClick} style={{ flex: 1, padding: "9px 8px", borderRadius: 14, fontSize: 12, fontWeight: 800, border: active ? "2px solid var(--ink)" : "2px solid #e8dfcc", background: active ? "var(--ink)" : "#fff", color: active ? "#fff" : "var(--ink)" }}>{label}</button>;
}
function Line({ k, v, bold }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{k}</span><span style={{ fontSize: 13, color: bold ? "var(--coral)" : "var(--ink)", fontWeight: bold ? 800 : 700 }}>{v}</span></div>;
}
