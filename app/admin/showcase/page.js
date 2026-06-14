"use client";

import { useState, useEffect } from "react";
import AdminShell from "../AdminShell";
import { useAdmin } from "../useAdmin";

export default function AdminShowcase() {
  const { loading, supabase } = useAdmin();
  const [vids, setVids] = useState([]);
  const [profs, setProfs] = useState({});
  const [tab, setTab] = useState("pending");
  const [busy, setBusy] = useState(null);

  const load = async (sb) => {
    const { data } = await sb.from("portfolio").select("*").order("created_at", { ascending: false });
    const list = data || [];
    setVids(list);
    const ids = [...new Set(list.map((v) => v.creator_id))];
    if (ids.length) {
      const { data: p } = await sb.from("profiles").select("id, full_name, instagram_handle, niche").in("id", ids);
      const m = {}; (p || []).forEach((x) => { m[x.id] = x; }); setProfs(m);
    }
  };
  useEffect(() => { if (supabase) load(supabase); }, [supabase]);

  const setStatus = async (v, status) => {
    setBusy(v.id);
    await supabase.from("portfolio").update({ status }).eq("id", v.id);
    if (status === "approved") {
      await supabase.from("notifications").insert({ user_id: v.creator_id, kind: "message", text: "A showcase video was approved and is now live on your profile! 🎉", link: "/app/profile" });
    }
    await load(supabase);
    setBusy(null);
  };

  if (loading) return <AdminShell><p style={{ color: "var(--muted)", fontWeight: 600 }}>Loading…</p></AdminShell>;

  const rows = vids.filter((v) => v.status === tab);
  const counts = {
    pending: vids.filter((v) => v.status === "pending").length,
    approved: vids.filter((v) => v.status === "approved").length,
    rejected: vids.filter((v) => v.status === "rejected").length,
  };

  return (
    <AdminShell>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>Showcase review</h1>
      <p style={{ fontSize: 14, color: "var(--coral)", fontWeight: 800, margin: "0 0 18px" }}>{counts.pending} waiting for review</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Tab label={`Pending (${counts.pending})`} active={tab === "pending"} onClick={() => setTab("pending")} />
        <Tab label={`Approved (${counts.approved})`} active={tab === "approved"} onClick={() => setTab("approved")} />
        <Tab label={`Rejected (${counts.rejected})`} active={tab === "rejected"} onClick={() => setTab("rejected")} />
      </div>

      {rows.length === 0 ? <p style={{ color: "var(--muted)", fontWeight: 600 }}>Nothing here.</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {rows.map((v) => {
            const c = profs[v.creator_id] || {};
            return (
              <div key={v.id} style={{ background: "#fff", borderRadius: 18, padding: 14, border: "1.5px solid #efe7d6" }}>
                <video src={v.video_url} controls playsInline style={{ width: "100%", borderRadius: 12, background: "#000", maxHeight: 320 }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", marginTop: 10 }}>{c.full_name || "—"}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{c.niche || "—"} · @{c.instagram_handle || "—"}</div>

                {tab === "pending" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => setStatus(v, "rejected")} disabled={busy === v.id} style={{ flex: 1, background: "#fff", color: "#A32D2D", border: "2px solid #A32D2D", borderRadius: 14, padding: "10px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Reject</button>
                    <button onClick={() => setStatus(v, "approved")} disabled={busy === v.id} style={{ flex: 1, background: "var(--ink)", color: "#fff", border: "none", borderRadius: 14, padding: "10px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Approve ✓</button>
                  </div>
                )}
                {tab === "approved" && (
                  <button onClick={() => setStatus(v, "rejected")} disabled={busy === v.id} style={{ width: "100%", marginTop: 12, background: "#fff", color: "#A32D2D", border: "2px solid #A32D2D", borderRadius: 14, padding: "10px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Take down</button>
                )}
                {tab === "rejected" && (
                  <button onClick={() => setStatus(v, "approved")} disabled={busy === v.id} style={{ width: "100%", marginTop: 12, background: "var(--green)", color: "#173404", border: "none", borderRadius: 14, padding: "10px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Approve after all ✓</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

function Tab({ label, active, onClick }) {
  return <button onClick={onClick} style={{ flex: 1, maxWidth: 160, padding: "9px 8px", borderRadius: 14, fontSize: 12, fontWeight: 800, border: active ? "2px solid var(--ink)" : "2px solid #e8dfcc", background: active ? "var(--ink)" : "#fff", color: active ? "#fff" : "var(--ink)" }}>{label}</button>;
}
