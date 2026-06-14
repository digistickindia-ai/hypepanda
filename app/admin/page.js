"use client";

import { useState, useEffect } from "react";
import AdminShell from "./AdminShell";
import { useAdmin } from "./useAdmin";
import { inr, commissionAmount } from "@/lib/me";

export default function AdminOverview() {
  const { loading, supabase } = useAdmin();
  const [stats, setStats] = useState(null);

  useEffect(() => { if (!supabase) return; (async () => {
    const { data: profiles } = await supabase.from("profiles").select("role, onboarding_done, suspended");
    const { data: deals } = await supabase.from("deals").select("amount, status, payment_status, commission_pct");
    const p = profiles || [], d = deals || [];

    const creators = p.filter((x) => x.role === "creator").length;
    const businesses = p.filter((x) => x.role === "business" || x.role === "agency").length;
    const held = d.filter((x) => x.payment_status === "secured").reduce((s, x) => s + (x.amount || 0), 0);
    const earned = d.filter((x) => x.payment_status === "paid_out").reduce((s, x) => s + commissionAmount(x.amount, x.commission_pct || 10), 0);
    const gmv = d.filter((x) => x.payment_status !== "unpaid").reduce((s, x) => s + (x.amount || 0), 0);

    setStats({
      users: p.length, creators, businesses,
      deals: d.length,
      activeDeals: d.filter((x) => ["accepted", "in_progress", "delivered"].includes(x.status)).length,
      completed: d.filter((x) => x.status === "completed").length,
      held, earned, gmv,
    });
  })(); }, [supabase]);

  if (loading || !stats) return <AdminShell><Loading /></AdminShell>;

  return (
    <AdminShell>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "0 0 18px" }}>Overview</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <Card label="Total users" value={stats.users} color="var(--ink)" />
        <Card label="Creators" value={stats.creators} color="var(--coral)" />
        <Card label="Businesses" value={stats.businesses} color="var(--blue)" />
        <Card label="Total deals" value={stats.deals} color="var(--pink)" />
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: "0 0 12px" }}>Money</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <Card label="GMV (total transacted)" value={inr(stats.gmv)} color="var(--ink)" />
        <Card label="Held by you now" value={inr(stats.held)} color="var(--blue)" />
        <Card label="Your earnings" value={inr(stats.earned)} color="var(--green)" />
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: "0 0 12px" }}>Deals</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <Card label="Active" value={stats.activeDeals} color="var(--yellow)" dark />
        <Card label="Completed" value={stats.completed} color="var(--green)" />
      </div>
    </AdminShell>
  );
}

function Card({ label, value, color, dark }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 20, border: "1.5px solid #efe7d6" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Loading() {
  return <p style={{ color: "var(--muted)", fontWeight: 600 }}>Loading…</p>;
}
