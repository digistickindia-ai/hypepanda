"use client";

import { useState, useEffect } from "react";
import AdminShell from "../AdminShell";
import { useAdmin } from "../useAdmin";
import { inr, fmtFollowers } from "@/lib/me";

export default function AdminUsers() {
  const { loading, supabase, profile } = useAdmin();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(null);

  const load = async (sb) => {
    const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  };
  useEffect(() => { if (supabase) load(supabase); }, [supabase]);

  const toggleSuspend = async (u) => {
    setBusy(u.id);
    await supabase.from("profiles").update({ suspended: !u.suspended }).eq("id", u.id);
    await load(supabase);
    setBusy(null);
  };
  const toggleVerify = async (u) => {
    setBusy(u.id);
    await supabase.from("profiles").update({ instagram_connected: !u.instagram_connected }).eq("id", u.id);
    await load(supabase);
    setBusy(null);
  };

  if (loading) return <AdminShell><p style={{ color: "var(--muted)", fontWeight: 600 }}>Loading…</p></AdminShell>;

  const filtered = users.filter((u) => {
    const mq = !q || (u.full_name || "").toLowerCase().includes(q.toLowerCase()) || (u.instagram_handle || "").toLowerCase().includes(q.toLowerCase()) || (u.company_name || "").toLowerCase().includes(q.toLowerCase());
    const mf = filter === "all" || (filter === "creator" && u.role === "creator") || (filter === "business" && (u.role === "business" || u.role === "agency"));
    return mq && mf;
  });

  return (
    <AdminShell>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "0 0 16px" }}>Users ({users.length})</h1>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, handle, company…" style={{ width: "100%", padding: "12px 16px", fontSize: 14, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 14, background: "#fff", color: "var(--ink)", outline: "none", fontFamily: "inherit", marginBottom: 12 }} />

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["all", "creator", "business"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 16px", borderRadius: 14, fontSize: 13, fontWeight: 800, border: filter === f ? "2px solid var(--ink)" : "2px solid #e8dfcc", background: filter === f ? "var(--ink)" : "#fff", color: filter === f ? "#fff" : "var(--ink)", textTransform: "capitalize" }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((u) => {
          const isCreator = u.role === "creator";
          const init = (u.full_name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div key={u.id} style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1.5px solid #efe7d6", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", opacity: u.suspended ? 0.55 : 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: isCreator ? "var(--coral)" : "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{init}</div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                  {u.full_name || "—"}
                  {u.is_admin && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: "var(--coral)" }}>ADMIN</span>}
                  {u.suspended && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: "#A32D2D" }}>SUSPENDED</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                  {isCreator ? `${u.niche || "—"} · @${u.instagram_handle || "—"}` : `${u.company_name || "—"} · business`}
                  {u.city ? " · " + u.city : ""}
                </div>
                <div style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600 }}>
                  {isCreator && (u.instagram_connected ? `✓ ${fmtFollowers(u.followers)} followers · ${inr(u.rate_per_post)}/post` : "not verified")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {isCreator && (
                  <button onClick={() => toggleVerify(u)} disabled={busy === u.id} style={btn(u.instagram_connected ? "#fff" : "var(--green)", u.instagram_connected ? "var(--ink)" : "#173404", u.instagram_connected)}>
                    {u.instagram_connected ? "Unverify" : "Verify"}
                  </button>
                )}
                {!u.is_admin && (
                  <button onClick={() => toggleSuspend(u)} disabled={busy === u.id} style={btn(u.suspended ? "var(--green)" : "#fff", u.suspended ? "#173404" : "#A32D2D", true)}>
                    {u.suspended ? "Unsuspend" : "Suspend"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}

function btn(bg, color, outline) {
  return { background: bg, color, border: outline ? "2px solid " + (color === "#A32D2D" ? "#A32D2D" : "#e8dfcc") : "none", borderRadius: 14, padding: "8px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" };
}
