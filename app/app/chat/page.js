"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadMe } from "@/lib/me";
import TabBar from "../TabBar";
import Panda from "../../Panda";

export default function TeamChat() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const supaRef = useRef(null);

  const loadMsgs = async (supabase, uid) => {
    const { data } = await supabase.from("team_messages").select("*").eq("user_id", uid).order("created_at", { ascending: true });
    setMsgs(data || []);
    // mark team messages as read by user
    const unread = (data || []).filter((m) => m.from_team && !m.read_by_user);
    if (unread.length) {
      await supabase.from("team_messages").update({ read_by_user: true }).eq("user_id", uid).eq("from_team", true).eq("read_by_user", false);
    }
  };

  useEffect(() => {
    (async () => {
      const res = await loadMe(router);
      if (!res) return;
      setMe(res);
      supaRef.current = res.supabase;
      await loadMsgs(res.supabase, res.profile.id);
      setLoading(false);
      // realtime: new messages in this user's thread
      const ch = res.supabase
        .channel("team_thread_" + res.profile.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_messages", filter: `user_id=eq.${res.profile.id}` },
          (payload) => { setMsgs((m) => [...m, payload.new]); })
        .subscribe();
      return () => { res.supabase.removeChannel(ch); };
    })();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const { error } = await supaRef.current.from("team_messages").insert({
      user_id: me.profile.id, from_team: false, body, read_by_team: false,
    });
    if (error) { setSending(false); setText(body); alert("Couldn't send: " + error.message); return; }
    // notify the team (admins) in-app
    const { data: admins } = await supaRef.current.from("profiles").select("id").eq("is_admin", true);
    if (admins?.length) {
      await supaRef.current.from("notifications").insert(admins.map((a) => ({
        user_id: a.id, kind: "message",
        text: `${me.profile.company_name || me.profile.full_name} messaged the team`,
        link: "/admin/messages",
      })));
    }
    setSending(false);
  };

  if (loading) return <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}><Panda size={72} /></main>;

  return (
    <div style={{ height: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1.5px solid #efe7d6", background: "#fff" }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <Panda size={34} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: 5 }}>
            HypePanda Team
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#5BA9E8"><path d="M12 2l2.4 2.1 3.2-.3 1 3 2.8 1.5-1 3 1 3-2.8 1.5-1 3-3.2-.3L12 22l-2.4-2.1-3.2.3-1-3L2.6 15.6l1-3-1-3 2.8-1.5 1-3 3.2.3z" /><path d="M9.5 12.5l1.8 1.8 3.5-3.8" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>We coordinate all your collaborations</div>
        </div>
      </div>

      {/* messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--faint)", fontWeight: 600, margin: "4px 0 8px", lineHeight: 1.5 }}>
          This is your private line to the HypePanda team. Brands and creators never message each other directly — we handle every collaboration for you.
        </div>
        {msgs.length === 0 && (
          <div style={{ background: "#fff", border: "1.5px solid #efe7d6", borderRadius: 16, padding: 16, fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.5 }}>
            👋 Hi! The HypePanda team is here to help. Ask us anything about your collaborations, deliverables, or payments.
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} style={{ alignSelf: m.from_team ? "flex-start" : "flex-end", maxWidth: "80%" }}>
            <div style={{
              background: m.from_team ? "#fff" : "var(--ink)",
              color: m.from_team ? "var(--ink)" : "#fff",
              border: m.from_team ? "1.5px solid #efe7d6" : "none",
              borderRadius: 18, padding: "11px 15px", fontSize: 14.5, fontWeight: 500, lineHeight: 1.45, whiteSpace: "pre-wrap",
            }}>{m.body}</div>
            <div style={{ fontSize: 10.5, color: "var(--faint)", fontWeight: 600, marginTop: 3, textAlign: m.from_team ? "left" : "right" }}>
              {m.from_team ? "HypePanda Team" : "You"} · {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div style={{ display: "flex", gap: 8, padding: "12px 14px calc(12px + env(safe-area-inset-bottom))", borderTop: "1.5px solid #efe7d6", background: "#fff" }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Message the HypePanda team…" style={{ flex: 1, padding: "13px 16px", fontSize: 14.5, fontWeight: 500, border: "2px solid #e8dfcc", borderRadius: 22, outline: "none", fontFamily: "inherit" }} />
        <button onClick={send} disabled={sending || !text.trim()} style={{ background: text.trim() ? "var(--ink)" : "#d8cfbc", color: "#fff", border: "none", borderRadius: "50%", width: 46, height: 46, flexShrink: 0, fontSize: 18, cursor: "pointer" }}>↑</button>
      </div>

      <TabBar active="chat" />
    </div>
  );
}
