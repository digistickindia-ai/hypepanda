"use client";

import { useState, useEffect } from "react";
import AdminShell from "../AdminShell";
import { useAdmin } from "../useAdmin";
import { inr } from "@/lib/me";

const SC = { pending: "var(--yellow)", accepted: "var(--green)", declined: "#e0d8c8", in_progress: "var(--blue)", delivered: "var(--pink)", completed: "var(--green)", cancelled: "#e0d8c8" };

export default function AdminDeals() {
  const { loading, supabase } = useAdmin();
  const [deals, setDeals] = useState([]);
  const [profs, setProfs] = useState({});
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(null);

  const load = async (sb) => {
    const { data } = await sb.from("deals").select("*").order("updated_at", { ascending: false });
    const list = data || [];
    setDeals(list);
    const ids = [...new Set(list.flatMap((d) => [d.business_id, d.creator_id]))];
    if (ids.length) {
      const { data: p } = await sb.from("profiles").select("id, full_name, company_name").in("id", ids);
      const m = {}; (p || []).forEach((x) => { m[x.id] = x; }); setProfs(m);
    }
  };
  useEffect(() => { if (supabase) load(supabase); }, [supabase]);

  const cancelDeal = async (d) => {
    if (!confirm("Cancel this deal? This can't be undone.")) return;
    setBusy(d.id);
    await supabase.from("deals").update({ status: "cancelled" }).eq("id", d.id);
    await load(supabase);
    setBusy(null);
  };

  if (loading) return <AdminShell><p style={{ color: "var(--muted)", fontWeight: 600 }}>Loading…</p></AdminShell>;

  const rows = filter === "all" ? deals : deals.filter((d) => d.status === filter);

  return (
    <AdminShell>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "0 0 16px" }}>Deals ({deals.length})</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto" }}>
        {["all", "pending", "accepted", "in_progress", "delivered", "completed", "cancelled"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 14, fontSize: 12, fontWeight: 800, border: filter === f ? "2px solid var(--ink)" : "2px solid #e8dfcc", background: filter === f ? "var(--ink)" : "#fff", color: filter === f ? "#fff" : "var(--ink)", textTransform: "capitalize" }}>{f.replace("_", " ")}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.length === 0 ? <p style={{ color: "var(--muted)", fontWeight: 600 }}>No deals here.</p> : rows.map((d) => {
          const b = profs[d.business_id] || {}, c = profs[d.creator_id] || {};
          return (
            <div key={d.id} style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1.5px solid #efe7d6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{d.title}</div>
                <span style={{ background: SC[d.status] || "#e0d8c8", color: "#1c1c1c", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 12, whiteSpace: "nowrap", textTransform: "capitalize" }}>{(d.status || "").replace("_", " ")}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 4 }}>
                {(b.company_name || b.full_name || "—")} → {(c.full_name || "—")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--coral)" }}>{inr(d.amount)}</span>
                {d.status !== "completed" && d.status !== "cancelled" && (
                  <button onClick={() => cancelDeal(d)} disabled={busy === d.id} style={{ background: "#fff", color: "#A32D2D", border: "2px solid #A32D2D", borderRadius: 12, padding: "7px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Cancel deal</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
