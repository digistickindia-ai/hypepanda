"use client";

import { useState, useEffect } from "react";
import AdminShell from "../AdminShell";
import { useAdmin } from "../useAdmin";
import { fmtFollowers } from "@/lib/me";

export default function AdminVerify() {
  const { loading, supabase } = useAdmin();
  const [creators, setCreators] = useState([]);
  const [tab, setTab] = useState("pending");
  const [busy, setBusy] = useState(null);
  const [followerInputs, setFollowerInputs] = useState({});

  const load = async (sb) => {
    const { data } = await sb.from("profiles").select("*").eq("role", "creator").order("created_at", { ascending: false });
    setCreators(data || []);
  };
  useEffect(() => { if (supabase) load(supabase); }, [supabase]);

  const approve = async (c) => {
    const followers = followerInputs[c.id] != null && followerInputs[c.id] !== "" ? Number(followerInputs[c.id]) : c.followers;
    setBusy(c.id);
    const { error } = await supabase.from("profiles").update({ verification_status: "verified", followers, instagram_connected: true }).eq("id", c.id);
    if (error) { setBusy(null); alert("Couldn't verify: " + error.message + "\n\nIf this mentions a policy, run verification-patch.sql in Supabase."); return; }
    await supabase.from("notifications").insert({ user_id: c.id, kind: "accepted", text: "Your account is verified — you're now live on HypePanda with a verified badge!", link: "/app/profile" });
    try {
      await fetch("/api/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: c.email, name: c.full_name }) });
    } catch (e) {}
    await load(supabase);
    setBusy(null);
  };

  const updateFollowers = async (c) => {
    const v = followerInputs[c.id];
    const n = v != null && v !== "" ? Number(v) : null;
    setBusy(c.id);
    const { error } = await supabase.from("profiles").update({ followers: n }).eq("id", c.id);
    if (error) { setBusy(null); alert("Couldn't update: " + error.message); return; }
    await load(supabase);
    setBusy(null);
  };

  const reject = async (c) => {
    setBusy(c.id);
    const { error } = await supabase.from("profiles").update({ verification_status: "rejected" }).eq("id", c.id);
    if (error) { setBusy(null); alert("Couldn't update: " + error.message + "\n\nIf this mentions a policy, run verification-patch.sql in Supabase."); return; }
    await supabase.from("notifications").insert({ user_id: c.id, kind: "message", text: "Your verification needs another look — please re-submit your Instagram link from your profile.", link: "/app/profile" });
    await load(supabase);
    setBusy(null);
  };

  if (loading) return <AdminShell><p style={{ color: "var(--muted)", fontWeight: 600 }}>Loading…</p></AdminShell>;

  const counts = {
    pending: creators.filter((c) => c.verification_status === "pending").length,
    verified: creators.filter((c) => c.verification_status === "verified").length,
    rejected: creators.filter((c) => c.verification_status === "rejected").length,
  };
  const rows = creators.filter((c) => (c.verification_status || "none") === tab || (tab === "pending" && c.verification_status === "pending"));

  return (
    <AdminShell>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>Creator verification</h1>
      <p style={{ fontSize: 14, color: "var(--coral)", fontWeight: 800, margin: "0 0 18px" }}>{counts.pending} waiting for verification</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Tab label={`Pending (${counts.pending})`} active={tab === "pending"} onClick={() => setTab("pending")} />
        <Tab label={`Verified (${counts.verified})`} active={tab === "verified"} onClick={() => setTab("verified")} />
        <Tab label={`Rejected (${counts.rejected})`} active={tab === "rejected"} onClick={() => setTab("rejected")} />
      </div>

      {rows.length === 0 ? <p style={{ color: "var(--muted)", fontWeight: 600 }}>Nothing here.</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {rows.map((c) => {
            const link = c.instagram_url || (c.instagram_handle ? "https://instagram.com/" + c.instagram_handle : null);
            return (
              <div key={c.id} style={{ background: "#fff", borderRadius: 18, padding: 16, border: "1.5px solid #efe7d6" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{c.full_name || "—"}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 10 }}>{c.niche || "—"} · {c.city || "—"}</div>

                {link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "#FBF3E4", borderRadius: 12, padding: "11px 14px", fontSize: 13, fontWeight: 800, color: "var(--blue)", textDecoration: "none", wordBreak: "break-all", marginBottom: 12 }}>
                    {link} ↗
                  </a>
                ) : <p style={{ fontSize: 13, color: "var(--faint)", fontWeight: 600 }}>No Instagram link submitted.</p>}

                {tab === "pending" && (
                  <>
                    <input type="number" value={followerInputs[c.id] ?? (c.followers || "")} onChange={(e) => setFollowerInputs({ ...followerInputs, [c.id]: e.target.value })} placeholder="Confirm follower count" style={{ width: "100%", padding: "11px 14px", fontSize: 14, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => reject(c)} disabled={busy === c.id} style={{ flex: 1, background: "#fff", color: "#A32D2D", border: "2px solid #A32D2D", borderRadius: 14, padding: "10px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Reject</button>
                      <button onClick={() => approve(c)} disabled={busy === c.id} style={{ flex: 1, background: "var(--ink)", color: "#fff", border: "none", borderRadius: 14, padding: "10px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Verify &amp; go live</button>
                    </div>
                  </>
                )}
                {tab === "verified" && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 10 }}>✓ Verified · {c.followers != null ? fmtFollowers(c.followers) + " followers" : "live"}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type="number" value={followerInputs[c.id] ?? (c.followers ?? "")} onChange={(e) => setFollowerInputs({ ...followerInputs, [c.id]: e.target.value })} placeholder="Update followers" style={{ flex: 1, padding: "10px 12px", fontSize: 14, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                      <button onClick={() => updateFollowers(c)} disabled={busy === c.id} style={{ background: "var(--ink)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Save</button>
                    </div>
                  </div>
                )}
                {tab === "rejected" && (
                  <button onClick={() => approve(c)} disabled={busy === c.id} style={{ width: "100%", background: "var(--green)", color: "#173404", border: "none", borderRadius: 14, padding: "10px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Verify after all</button>
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
