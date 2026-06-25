"use client";

import { useState, useEffect } from "react";
import AdminShell from "../AdminShell";
import { useAdmin } from "../useAdmin";
import { inr } from "@/lib/me";
import { sendEmail } from "@/lib/sendEmail";

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
  const [msgDraft, setMsgDraft] = useState({});

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
    // notify + email both parties on status change
    if (patch.status) {
      const map = {
        quoted: "The creator has sent a quotation. Our team is reviewing it and will share details shortly.",
        confirmed: "Your collaboration is confirmed! Our team will coordinate the deliverables and next steps with you.",
        in_progress: "Your collaboration is now in progress — our team is coordinating it.",
        completed: "Your collaboration is complete. Thank you for working with HypePanda!",
        cancelled: "Your collaboration request was cancelled. Reach out to our team for details.",
      };
      const msg = map[patch.status];
      if (msg) {
        await supabase.from("notifications").insert([
          { user_id: c.brand_id, kind: "accepted", text: msg, link: "/app/deals" },
          { user_id: c.creator_id, kind: "accepted", text: msg, link: "/app/deals" },
        ]);
        // emails (compulsory) to both sides via Resend
        const subj = "Update on your HypePanda collaboration";
        for (const uid of [c.brand_id, c.creator_id]) {
          sendEmail({ to_user_id: uid, subject: subj, heading: "Collaboration update", message: msg, ctaText: "View in HypePanda", ctaLink: "https://www.hypepanda.in/app/deals" });
        }
      }
    }
    await load(supabase);
    setBusy(null);
  };

  // Team sends a direct message (in-app + email) to one party of the collab
  const messageUser = async (c, uid, body) => {
    if (!body.trim()) return;
    setBusy(c.id);
    await supabase.from("team_messages").insert({ user_id: uid, collab_id: c.id, from_team: true, body: body.trim(), read_by_team: true });
    await supabase.from("notifications").insert({ user_id: uid, kind: "message", text: "The HypePanda team sent you a message.", link: "/app/chat" });
    sendEmail({ to_user_id: uid, subject: "Message from the HypePanda team", heading: "You have a new message", message: body.trim(), ctaText: "Reply in HypePanda", ctaLink: "https://www.hypepanda.in/app/chat" });
    setMsgDraft({ ...msgDraft, [uid]: "" });
    setBusy(null);
    alert("Message sent (in-app + email).");
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, margin: "12px 0", fontSize: 12 }}>
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

                {/* team → message either party (in-app + email) */}
                <div style={{ borderTop: "1px solid #f1ead9", marginTop: 14, paddingTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                  {[["brand", c.brand_id, "brand"], ["creator", c.creator_id, "creator"]].map(([label, uid]) => (
                    <div key={uid}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 5 }}>Message {label}</div>
                      <textarea value={msgDraft[uid] || ""} onChange={(e) => setMsgDraft({ ...msgDraft, [uid]: e.target.value })} placeholder={`Write to the ${label}…`} style={{ width: "100%", minHeight: 46, fontSize: 13, fontWeight: 500, border: "2px solid #e8dfcc", borderRadius: 10, padding: "8px 10px", outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                      <button onClick={() => messageUser(c, uid, msgDraft[uid] || "")} disabled={busy === c.id || !(msgDraft[uid] || "").trim()} style={{ ...smallBtn, marginTop: 6, width: "100%", background: (msgDraft[uid] || "").trim() ? "var(--ink)" : "#d8d0c0" }}>Send + email</button>
                    </div>
                  ))}
                </div>

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
