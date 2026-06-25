"use client";

import { useState, useEffect } from "react";
import AdminShell from "../AdminShell";
import { useAdmin } from "../useAdmin";
import { inr } from "@/lib/me";

const STATUS = ["requested", "quoted", "confirmed", "completed", "cancelled"];
const STATUS_LABEL = { requested: "Requested", quoted: "Quote sent", confirmed: "Confirmed", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };
const STATUS_COLOR = { requested: "var(--yellow)", quoted: "var(--blue)", confirmed: "var(--green)", in_progress: "var(--blue)", completed: "var(--green)", cancelled: "#bbb" };

export default function AdminCollabs() {
  const { loading, supabase } = useAdmin();
  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [tab, setTab] = useState("requested");
  const [busy, setBusy] = useState(null);
  const [edits, setEdits] = useState({});

  const load = async (sb) => {
    const { data } = await sb.from("collaborations").select("*").order("created_at", { ascending: false });
    const list = data || [];
    setRows(list);
    const ids = [...new Set(list.flatMap((c) => [c.brand_id, c.creator_id]))];
    if (ids.length) {
      const { data: profs } = await sb.from("profiles").select("id, full_name, company_name, role, email, phone, instagram_handle").in("id", ids);
      const map = {};
      (profs || []).forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
  };
  useEffect(() => { if (supabase) load(supabase); }, [supabase]);

  const name = (id) => { const p = profiles[id]; return p ? (p.company_name || p.full_name || "—") : "…"; };

  const update = async (c, patch) => {
    setBusy(c.id);
    const { error } = await supabase.from("collaborations").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", c.id);
    if (error) { setBusy(null); alert("Couldn't update: " + error.message + "\n\nIf this mentions a policy, run collaborations-patch.sql."); return; }
    // notify both parties on status change
    if (patch.status) {
      const msg = patch.status === "in_progress" ? "Your collaboration is now in progress — our team is coordinating it."
        : patch.status === "completed" ? "Your collaboration is complete. Thank you!"
        : patch.status === "cancelled" ? "Your collaboration request was cancelled. Reach out to our team for details."
        : null;
      if (msg) {
        await supabase.from("notifications").insert([
          { user_id: c.brand_id, kind: "accepted", text: msg, link: "/app/deals" },
          { user_id: c.creator_id, kind: "accepted", text: msg, link: "/app/deals" },
        ]);
      }
    }
    await load(supabase);
    setBusy(null);
  };

  if (loading) return <AdminShell><p style={{ color: "var(--muted)", fontWeight: 600 }}>Loading…</p></AdminShell>;

  const counts = {};
  STATUS.forEach((s) => { counts[s] = rows.filter((r) => r.status === s).length; });
  const filtered = rows.filter((r) => r.status === tab);

  return (
    <AdminShell>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>Collaborations</h1>
      <p style={{ fontSize: 14, color: "var(--coral)", fontWeight: 800, margin: "0 0 18px" }}>{counts.requested} new request{counts.requested === 1 ? "" : "s"} to coordinate</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {STATUS.map((s) => (
          <button key={s} onClick={() => setTab(s)} style={{ padding: "9px 14px", borderRadius: 14, fontSize: 13, fontWeight: 800, border: tab === s ? "2px solid var(--ink)" : "2px solid #e8dfcc", background: tab === s ? "var(--ink)" : "#fff", color: tab === s ? "#fff" : "var(--ink)" }}>
            {STATUS_LABEL[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? <p style={{ color: "var(--muted)", fontWeight: 600 }}>Nothing here.</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((c) => {
            const brand = profiles[c.brand_id], creator = profiles[c.creator_id];
            const e = edits[c.id] || {};
            return (
              <div key={c.id} style={{ background: "#fff", borderRadius: 18, padding: 18, border: "1.5px solid #efe7d6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{name(c.brand_id)} <span style={{ color: "var(--faint)", fontWeight: 600 }}>→</span> {name(c.creator_id)}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
                      Requested {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <span style={{ background: STATUS_COLOR[c.status], color: c.status === "requested" ? "#412402" : "#fff", fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 12 }}>{STATUS_LABEL[c.status]}</span>
                </div>

                {c.title && <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginTop: 10 }}>{c.title}</div>}
                {c.brief && <div style={{ background: "#FBF3E4", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#3a352e", fontWeight: 500, margin: "8px 0" }}>{c.brief}</div>}
                {c.deliverables && <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>Deliverables: {c.deliverables}</div>}
                {(c.budget_range || c.timeline) && <div style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600, marginBottom: 4 }}>{c.budget_range && `Budget: ${c.budget_range}`}{c.budget_range && c.timeline && " · "}{c.timeline && `Timeline: ${c.timeline}`}</div>}
                {c.quote_amount != null && <div style={{ background: "#EAF4EA", border: "1px solid #cfe6cf", borderRadius: 12, padding: "10px 14px", margin: "8px 0", fontSize: 13, fontWeight: 800, color: "#2f5d22" }}>Creator quoted: ₹{Number(c.quote_amount).toLocaleString("en-IN")}{c.quote_note ? ` — ${c.quote_note}` : ""}</div>}

                {/* contact info for coordination */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "12px 0", fontSize: 12 }}>
                  <ContactCard label="Brand" p={brand} />
                  <ContactCard label="Creator" p={creator} />
                </div>

                {/* agreed amount + payment + notes */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                  <input type="number" defaultValue={c.amount ?? ""} onChange={(ev) => setEdits({ ...edits, [c.id]: { ...e, amount: ev.target.value } })} placeholder="Agreed amount ₹" style={inp} />
                  <button onClick={() => update(c, { amount: e.amount ? Number(e.amount) : null })} disabled={busy === c.id} style={smallBtn}>Save ₹</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.payment_status === "paid" ? "var(--green)" : "var(--coral)" }}>
                    Payment: {c.payment_status === "paid" ? "Paid ✓" : "Pending"}
                  </span>
                  <button onClick={() => update(c, { payment_status: c.payment_status === "paid" ? "pending" : "paid" })} disabled={busy === c.id} style={smallBtn}>
                    {c.payment_status === "paid" ? "Mark unpaid" : "Mark paid"}
                  </button>
                </div>

                <textarea defaultValue={c.team_notes ?? ""} onChange={(ev) => setEdits({ ...edits, [c.id]: { ...e, notes: ev.target.value } })} placeholder="Internal team notes (only you see this)" style={{ ...inp, width: "100%", minHeight: 54, resize: "vertical", boxSizing: "border-box" }} />
                <button onClick={() => update(c, { team_notes: e.notes ?? c.team_notes })} disabled={busy === c.id} style={{ ...smallBtn, marginTop: 6 }}>Save notes</button>

                {/* status actions */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, borderTop: "1px solid #f1ead9", paddingTop: 14 }}>
                  {STATUS.filter((s) => s !== c.status).map((s) => (
                    <button key={s} onClick={() => update(c, { status: s })} disabled={busy === c.id} style={{ background: STATUS_COLOR[s], color: s === "requested" ? "#412402" : "#fff", border: "none", borderRadius: 12, padding: "9px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                      → {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

function ContactCard({ label, p }) {
  if (!p) return <div style={{ background: "#FBF3E4", borderRadius: 12, padding: 10 }}><div style={{ fontWeight: 800, color: "var(--muted)" }}>{label}</div><div style={{ color: "var(--faint)" }}>…</div></div>;
  return (
    <div style={{ background: "#FBF3E4", borderRadius: 12, padding: 10 }}>
      <div style={{ fontWeight: 800, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 700, color: "var(--ink)" }}>{p.company_name || p.full_name || "—"}</div>
      {p.email && <div style={{ color: "var(--muted)", marginTop: 2, wordBreak: "break-all" }}>{p.email}</div>}
      {p.phone && <div style={{ color: "var(--muted)" }}>{p.phone}</div>}
      {p.instagram_handle && <a href={"https://instagram.com/" + p.instagram_handle} target="_blank" rel="noreferrer" style={{ color: "var(--blue)", fontWeight: 700 }}>@{p.instagram_handle}</a>}
    </div>
  );
}

const inp = { padding: "9px 12px", fontSize: 13, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 10, outline: "none", fontFamily: "inherit" };
const smallBtn = { background: "var(--ink)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer" };
