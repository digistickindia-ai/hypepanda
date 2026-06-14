"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadMe, inr, payout, commissionAmount } from "@/lib/me";
import TabBar from "../TabBar";

export default function Admin() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [deals, setDeals] = useState([]);
  const [profs, setProfs] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("topay");
  const [busy, setBusy] = useState(null);

  const reload = async (supabase) => {
    const { data } = await supabase.from("deals").select("*").order("updated_at", { ascending: false });
    const list = data || [];
    setDeals(list);
    const ids = [...new Set(list.flatMap((d) => [d.business_id, d.creator_id]))];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, full_name, company_name, instagram_handle").in("id", ids);
      const map = {}; (p || []).forEach((x) => { map[x.id] = x; });
      setProfs(map);
    }
  };

  useEffect(() => { (async () => {
    const res = await loadMe(router);
    if (!res) return;
    if (!res.profile.is_admin) { router.replace("/app/home"); return; }
    setMe(res);
    await reload(res.supabase);
    setLoading(false);
  })(); }, []);

  const markPaid = async (deal) => {
    setBusy(deal.id);
    await me.supabase.from("deals").update({ payment_status: "paid_out", paid_out_at: new Date().toISOString() }).eq("id", deal.id);
    await me.supabase.from("notifications").insert({ user_id: deal.creator_id, kind: "payment", text: `You've been paid ${inr(deal.payout_amount || payout(deal.amount))} for "${deal.title}" 🎉`, link: "/app/deals" });
    await reload(me.supabase);
    setBusy(null);
  };

  if (loading) return <main style={{ minHeight: "100dvh", background: "var(--cream)" }} />;

  // To pay: approved (completed) + secured, not yet paid out
  const toPay = deals.filter((d) => d.status === "completed" && d.payment_status === "secured");
  const secured = deals.filter((d) => d.payment_status === "secured" && d.status !== "completed");
  const done = deals.filter((d) => d.payment_status === "paid_out");

  const totalHeld = [...toPay, ...secured].reduce((s, d) => s + (d.amount || 0), 0);
  const totalOwed = toPay.reduce((s, d) => s + (d.payout_amount || payout(d.amount)), 0);
  const totalEarned = done.reduce((s, d) => s + commissionAmount(d.amount, d.commission_pct || 10), 0);

  const rows = tab === "topay" ? toPay : tab === "secured" ? secured : done;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "28px 22px 20px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", margin: "0 0 4px" }}>Payout queue</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, margin: "0 0 18px" }}>Admin only · HypePanda</p>

        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <MiniStat big={inr(totalHeld)} small="held by you" col="var(--blue)" />
          <MiniStat big={inr(totalOwed)} small="to pay out" col="var(--coral)" />
          <MiniStat big={inr(totalEarned)} small="your earnings" col="var(--green)" />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Tab label={`To pay (${toPay.length})`} active={tab === "topay"} onClick={() => setTab("topay")} />
          <Tab label={`Active (${secured.length})`} active={tab === "secured"} onClick={() => setTab("secured")} />
          <Tab label={`Paid (${done.length})`} active={tab === "done"} onClick={() => setTab("done")} />
        </div>

        {rows.length === 0 ? (
          <p style={{ color: "var(--muted)", fontWeight: 600, textAlign: "center", marginTop: 30 }}>Nothing here yet.</p>
        ) : rows.map((d) => {
          const creator = profs[d.creator_id] || {};
          const business = profs[d.business_id] || {};
          const creatorGets = d.payout_amount || payout(d.amount);
          return (
            <div key={d.id} style={{ background: "#fff", borderRadius: 20, padding: 18, border: "1.5px solid #efe7d6", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>{d.title}</div>
              <RowLine k="From (business)" v={business.company_name || business.full_name || "—"} />
              <RowLine k="To (creator)" v={(creator.full_name || "—") + (creator.instagram_handle ? " · @" + creator.instagram_handle : "")} />
              <RowLine k="Business paid" v={inr(d.amount)} />
              <RowLine k="Your fee" v={inr(commissionAmount(d.amount, d.commission_pct || 10))} />
              <RowLine k="Pay creator" v={inr(creatorGets)} bold />
              {tab === "topay" && (
                <button onClick={() => markPaid(d)} disabled={busy === d.id} className="pressable" style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 18, padding: "13px", fontSize: 14, fontWeight: 800, marginTop: 12 }}>
                  {busy === d.id ? "Marking…" : "Mark as paid " + inr(creatorGets)}
                </button>
              )}
              {tab === "done" && d.paid_out_at && (
                <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 700, marginTop: 8 }}>✓ Paid {new Date(d.paid_out_at).toLocaleDateString("en-IN")}</div>
              )}
            </div>
          );
        })}
      </div>
      <TabBar />
    </div>
  );
}

function MiniStat({ big, small, col }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "12px 10px", border: "1.5px solid #efe7d6", textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: col, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{big}</div>
      <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginTop: 2 }}>{small}</div>
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: "9px 8px", borderRadius: 16, fontSize: 12, fontWeight: 800, border: active ? "2px solid var(--ink)" : "2px solid #e8dfcc", background: active ? "var(--ink)" : "#fff", color: active ? "#fff" : "var(--ink)" }}>{label}</button>
  );
}

function RowLine({ k, v, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
      <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{k}</span>
      <span style={{ fontSize: 13, color: bold ? "var(--coral)" : "var(--ink)", fontWeight: bold ? 800 : 700 }}>{v}</span>
    </div>
  );
}
