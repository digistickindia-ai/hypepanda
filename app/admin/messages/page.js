"use client";

import { useState, useEffect, useRef } from "react";
import AdminShell from "../AdminShell";
import { useAdmin } from "../useAdmin";
import { sendEmail } from "@/lib/sendEmail";

export default function AdminMessages() {
  const { supabase, loading: adminLoading } = useAdmin();
  const [threads, setThreads] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [active, setActive] = useState(null);   // user_id of open thread
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [threadOffset, setThreadOffset] = useState(0);
  const endRef = useRef(null);
  const refreshTimer = useRef(null);
  const activeRef = useRef(null);
  useEffect(() => { activeRef.current = active; }, [active]);

  const THREAD_PAGE = 30;
  const loadThreads = async ({ append = false, from = 0 } = {}) => {
    // Paginated: latest message per thread + unread counts, computed in the DB.
    const { data, error } = await supabase.rpc("admin_message_threads", { limit_n: THREAD_PAGE, offset_n: from });
    if (error) {
      // Fallback to the old method if the function isn't present yet.
      const { data: all } = await supabase.from("team_messages").select("*").order("created_at", { ascending: false }).limit(500);
      const byUser = {};
      for (const m of (all || [])) {
        if (!byUser[m.user_id]) byUser[m.user_id] = { user_id: m.user_id, last: { body: m.body, from_team: m.from_team }, unread: 0 };
        if (!m.from_team && !m.read_by_team) byUser[m.user_id].unread++;
      }
      const arr = Object.values(byUser);
      setThreads(arr); setHasMore(false);
      await hydrateProfiles(arr.map((t) => t.user_id));
      setLoading(false);
      return;
    }
    const rows = (data || []).map((r) => ({ user_id: r.user_id, last: { body: r.last_body, from_team: r.last_from_team }, unread: r.unread }));
    setHasMore(rows.length === THREAD_PAGE);
    setThreads((prev) => append ? [...prev, ...rows] : rows);
    await hydrateProfiles(rows.map((t) => t.user_id), append);
    setLoading(false);
  };

  const hydrateProfiles = async (ids, append = false) => {
    if (!ids.length) return;
    const { data: profs } = await supabase.from("profiles").select("id, full_name, company_name, role, email").in("id", ids);
    setProfiles((prev) => { const map = append ? { ...prev } : {}; (profs || []).forEach((p) => { map[p.id] = p; }); return map; });
  };

  useEffect(() => { if (!adminLoading && supabase) loadThreads(); }, [adminLoading, supabase]);

  // Realtime: admin sees ALL inserts across team_messages (no user filter).
  useEffect(() => {
    if (adminLoading || !supabase) return;
    const ch = supabase
      .channel("admin_team_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_messages" }, (payload) => {
        const m = payload.new;
        // if it belongs to the open thread, append it live
        if (activeRef.current && m.user_id === activeRef.current) {
          setMsgs((cur) => cur.some((x) => x.id === m.id) ? cur : [...cur, m]);
          // it's a user message arriving while open → mark read by team
          if (!m.from_team) {
            supabase.from("team_messages").update({ read_by_team: true }).eq("id", m.id).then(() => {});
          }
        }
        // refresh the thread list (debounced) so a burst of messages doesn't
        // trigger a reload per message at scale.
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => { loadThreads({ from: 0 }); setThreadOffset(0); }, 800);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); clearTimeout(refreshTimer.current); };
  }, [adminLoading, supabase]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const loadMoreThreads = async () => { const next = threadOffset + 30; setThreadOffset(next); await loadThreads({ append: true, from: next }); };

  const openThread = async (uid) => {
    setActive(uid);
    const { data } = await supabase.from("team_messages").select("*").eq("user_id", uid).order("created_at", { ascending: true });
    setMsgs(data || []);
    // mark user messages as read by team
    await supabase.from("team_messages").update({ read_by_team: true }).eq("user_id", uid).eq("from_team", false).eq("read_by_team", false);
    loadThreads();
  };

  const reply = async () => {
    const body = text.trim();
    if (!body || !active || busy) return;
    setBusy(true);
    setText("");
    await supabase.from("team_messages").insert({ user_id: active, from_team: true, body, read_by_team: true });
    await supabase.from("notifications").insert({ user_id: active, kind: "message", text: "The HypePanda team replied to you.", link: "/app/chat" });
    sendEmail({ to_user_id: active, subject: "Message from the HypePanda team", heading: "You have a new message", message: body, ctaText: "Reply in HypePanda", ctaLink: "https://www.hypepanda.in/app/chat" });
    const { data } = await supabase.from("team_messages").select("*").eq("user_id", active).order("created_at", { ascending: true });
    setMsgs(data || []);
    setBusy(false);
  };

  const nameOf = (uid) => { const p = profiles[uid]; return p ? (p.company_name || p.full_name || "User") : "User"; };
  const roleOf = (uid) => { const p = profiles[uid]; return p ? p.role : ""; };

  return (
    <AdminShell>
      <style>{`
        .msg-grid { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }
        .msg-back { display: none; }
        @media (max-width: 640px) {
          .msg-grid { grid-template-columns: 1fr; }
          .msg-list.has-active { display: none !important; }
          .msg-convo:not(.has-active) { display: none !important; }
          .msg-back { display: block !important; }
        }
      `}</style>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" }}>Messages</h1>
      <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, margin: "0 0 18px" }}>Every brand and creator talks only to the HypePanda team. Reply here — they get it in-app and by email.</p>

      {loading ? <p style={{ color: "var(--muted)", fontWeight: 600 }}>Loading…</p> : threads.length === 0 ? (
        <div style={{ background: "#fff", border: "1.5px solid #efe7d6", borderRadius: 16, padding: 28, textAlign: "center", color: "var(--muted)", fontWeight: 600 }}>No messages yet.</div>
      ) : (
        <div className="msg-grid">
          {/* thread list */}
          <div className={"msg-list" + (active ? " has-active" : "")} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {threads.map((t) => (
              <button key={t.user_id} onClick={() => openThread(t.user_id)} style={{
                textAlign: "left", background: active === t.user_id ? "var(--ink)" : "#fff",
                color: active === t.user_id ? "#fff" : "var(--ink)", border: "1.5px solid #efe7d6",
                borderRadius: 14, padding: "12px 14px", cursor: "pointer",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{nameOf(t.user_id)}</span>
                  {t.unread > 0 && <span style={{ background: "var(--coral)", color: "#fff", fontSize: 11, fontWeight: 800, borderRadius: 10, padding: "1px 7px" }}>{t.unread}</span>}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.3px", marginTop: 1 }}>{roleOf(t.user_id)}</div>
                <div style={{ fontSize: 12.5, fontWeight: 500, opacity: 0.85, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.last.from_team ? "You: " : ""}{t.last.body}</div>
              </button>
            ))}
            {hasMore && <button onClick={loadMoreThreads} style={{ padding: "10px", borderRadius: 12, border: "1.5px solid #e8dfcc", background: "#fff", color: "var(--ink)", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Load more</button>}
          </div>

          {/* conversation */}
          <div className={"msg-convo" + (active ? " has-active" : "")} style={{ background: "#fff", border: "1.5px solid #efe7d6", borderRadius: 16, minHeight: 420, display: "flex", flexDirection: "column" }}>
            {!active ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--faint)", fontWeight: 600 }}>Select a conversation</div>
            ) : (
              <>
                <div style={{ padding: "14px 18px", borderBottom: "1.5px solid #efe7d6", display: "flex", alignItems: "center", gap: 10 }}>
                  <button className="msg-back" onClick={() => setActive(null)} style={{ background: "none", border: "none", fontSize: 20, color: "var(--ink)", cursor: "pointer", padding: 0, lineHeight: 1 }}>←</button>
                  <div>
                    <div style={{ fontWeight: 800, color: "var(--ink)" }}>{nameOf(active)}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{profiles[active]?.email || ""}</div>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 420 }}>
                  {msgs.map((m) => (
                    <div key={m.id} style={{ alignSelf: m.from_team ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                      <div style={{ background: m.from_team ? "var(--ink)" : "#FBF3E4", color: m.from_team ? "#fff" : "var(--ink)", borderRadius: 14, padding: "9px 13px", fontSize: 13.5, fontWeight: 500, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{m.body}</div>
                      <div style={{ fontSize: 10, color: "var(--faint)", fontWeight: 600, marginTop: 2, textAlign: m.from_team ? "right" : "left" }}>{m.from_team ? "Team" : nameOf(active)} · {new Date(m.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <div style={{ display: "flex", gap: 8, padding: "12px 14px", borderTop: "1.5px solid #efe7d6" }}>
                  <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") reply(); }} placeholder="Reply to this user…" style={{ flex: 1, padding: "11px 14px", fontSize: 14, fontWeight: 500, border: "2px solid #e8dfcc", borderRadius: 20, outline: "none", fontFamily: "inherit" }} />
                  <button onClick={reply} disabled={busy || !text.trim()} style={{ background: text.trim() ? "var(--ink)" : "#d8cfbc", color: "#fff", border: "none", borderRadius: 20, padding: "0 20px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Send + email</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
