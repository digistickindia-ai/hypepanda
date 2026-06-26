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
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const PAGE = 30;
  const load = async (sb, { append = false, search = "", roleFilter = "all", from = 0 } = {}) => {
    let query = sb.from("profiles").select("*").order("created_at", { ascending: false });
    if (search) {
      const s = `%${search}%`;
      query = query.or(`full_name.ilike.${s},instagram_handle.ilike.${s},company_name.ilike.${s}`);
    }
    if (roleFilter === "creator") query = query.eq("role", "creator");
    if (roleFilter === "business") query = query.in("role", ["business", "agency"]);
    query = query.range(from, from + PAGE - 1);
    const { data } = await query;
    const rows = data || [];
    setHasMore(rows.length === PAGE);
    setUsers((prev) => append ? [...prev, ...rows] : rows);
  };

  const reload = async () => { setOffset(0); await load(supabase, { search: q, roleFilter: filter, from: 0 }); };
  const loadMore = async () => { const next = offset + PAGE; setOffset(next); await load(supabase, { append: true, search: q, roleFilter: filter, from: next }); };

  useEffect(() => { if (supabase) reload(); }, [supabase]);
  // re-query when filter changes or search is submitted (debounced)
  useEffect(() => {
    if (!supabase) return;
    const t = setTimeout(() => { reload(); }, 300);
    return () => clearTimeout(t);
  }, [q, filter]);

  const toggleSuspend = async (u) => {
    setBusy(u.id);
    const { data, error } = await supabase.from("profiles").update({ suspended: !u.suspended }).eq("id", u.id).select();
    if (error) { setBusy(null); alert("Couldn't update: " + error.message + "\n\nIf this mentions permission/policy, run fix-admin-suspend.sql in Supabase."); return; }
    if (!data || data.length === 0) { setBusy(null); alert("No row was updated — this is almost always an RLS permission issue. Run fix-admin-suspend.sql in Supabase, and make sure your account has is_admin = true."); return; }
    await reload();
    setBusy(null);
  };
  const deleteUser = async (u) => {
    const name = u.company_name || u.full_name || "this user";
    const ok = window.confirm(`Permanently delete ${name}?\n\nThis erases their profile, collaborations, messages, and login account. This CANNOT be undone.`);
    if (!ok) return;
    setBusy(u.id);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("/api/delete-user", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id: u.id, caller_token: token }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    if (j.error) { alert("Couldn't delete: " + j.error); return; }
    if (!j.authDeleted && j.authError) { alert("Data deleted, but login account removal failed: " + j.authError); }
    await reload();
  };
  const toggleVerify = async (u) => {
    setBusy(u.id);
    await supabase.from("profiles").update({ instagram_connected: !u.instagram_connected }).eq("id", u.id);
    await reload();
    setBusy(null);
  };
  const togglePro = async (u) => {
    setBusy(u.id);
    const active = u.is_pro && u.pro_until && new Date(u.pro_until).getTime() > Date.now();
    if (active) {
      await supabase.from("profiles").update({ is_pro: false, pro_until: null }).eq("id", u.id);
    } else {
      const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("profiles").update({ is_pro: true, pro_until: until }).eq("id", u.id);
    }
    await reload();
    setBusy(null);
  };

  if (loading) return <AdminShell><p style={{ color: "var(--muted)", fontWeight: 600 }}>Loading…</p></AdminShell>;

  const filtered = users;

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
                  {u.is_pro && u.pro_until && new Date(u.pro_until).getTime() > Date.now() && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: "#854F0B" }}>★ PRO</span>}
                  {u.suspended && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: "#A32D2D" }}>SUSPENDED</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                  {isCreator ? `${u.niche || "—"} · @${u.instagram_handle || "—"}` : `${u.company_name || "—"} · business`}
                  {u.city ? " · " + u.city : ""}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600, marginTop: 2, wordBreak: "break-all" }}>
                  {u.email ? <a href={"mailto:" + u.email} style={{ color: "var(--blue)", textDecoration: "none" }}>{u.email}</a> : <span style={{ color: "var(--faint)" }}>no email</span>}
                  {u.phone ? <> · <a href={"tel:" + u.phone} style={{ color: "var(--blue)", textDecoration: "none" }}>{u.phone}</a></> : ""}
                </div>
                <div style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600 }}>
                  {isCreator && (u.instagram_connected ? `✓ ${fmtFollowers(u.followers)} followers · ${inr(u.rate_per_post)}/post` : "not verified")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {isCreator && (
                  <button onClick={() => toggleVerify(u)} disabled={busy === u.id} style={btn(u.instagram_connected ? "#fff" : "var(--green)", u.instagram_connected ? "var(--ink)" : "#173404", u.instagram_connected)}>
                    {u.instagram_connected ? "Unverify" : "Verify"}
                  </button>
                )}
                {isCreator && (
                  <button onClick={() => togglePro(u)} disabled={busy === u.id} style={btn((u.is_pro && u.pro_until && new Date(u.pro_until).getTime() > Date.now()) ? "#fff" : "var(--yellow)", "#412402", true)}>
                    {(u.is_pro && u.pro_until && new Date(u.pro_until).getTime() > Date.now()) ? "Remove Pro" : "Grant Pro"}
                  </button>
                )}
                {!u.is_admin && (
                  <button onClick={() => toggleSuspend(u)} disabled={busy === u.id} style={btn(u.suspended ? "var(--green)" : "#fff", u.suspended ? "#173404" : "#A32D2D", true)}>
                    {u.suspended ? "Unsuspend" : "Suspend"}
                  </button>
                )}
                {!u.is_admin && (
                  <button onClick={() => deleteUser(u)} disabled={busy === u.id} style={btn("#A32D2D", "#fff", false)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ background: "#fff", border: "1.5px solid #efe7d6", borderRadius: 16, padding: 24, textAlign: "center", color: "var(--muted)", fontWeight: 600 }}>No users found.</div>}
      </div>
      {hasMore && (
        <button onClick={loadMore} style={{ width: "100%", marginTop: 14, padding: "13px", borderRadius: 14, border: "2px solid #e8dfcc", background: "#fff", color: "var(--ink)", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Load more</button>
      )}
    </AdminShell>
  );
}

function btn(bg, color, outline) {
  return { background: bg, color, border: outline ? "2px solid " + (color === "#A32D2D" ? "#A32D2D" : "#e8dfcc") : "none", borderRadius: 14, padding: "8px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" };
}
