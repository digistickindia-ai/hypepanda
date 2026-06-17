"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon";

const KIND_ICON = { offer: "handshake", accepted: "check", message: "message", payment: "rupee" };
const KIND_COLOR = { offer: "var(--pink)", accepted: "var(--green)", message: "var(--blue)", payment: "var(--coral)" };

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return m + "m";
  const h = Math.floor(m / 60); if (h < 24) return h + "h";
  const d = Math.floor(h / 24); if (d < 7) return d + "d";
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationBell({ supabase, userId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const wrapRef = useRef(null);

  const load = async () => {
    const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
    setItems(data || []);
  };

  useEffect(() => {
    if (!supabase || !userId) return;
    load();
    const channel = supabase
      .channel("notif-" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + userId }, (payload) => {
        setItems((prev) => [payload.new, ...prev].slice(0, 30));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  useEffect(() => {
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).in("id", ids);
  };

  const openItem = async (n) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button onClick={() => { setOpen((o) => !o); if (!open) setTimeout(markAllRead, 1500); }} aria-label="Notifications" style={{ position: "relative", width: 42, height: 42, borderRadius: "50%", background: "#fff", border: "1.5px solid #efe7d6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <Icon name="bell" size={21} color="var(--ink)" />
        {unread > 0 && (
          <span style={{ position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: "var(--coral)", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--cream)" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: 50, right: 0, width: 320, maxWidth: "86vw", maxHeight: 420, overflowY: "auto", background: "#fff", border: "1.5px solid #efe7d6", borderRadius: 18, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", zIndex: 50 }}>
          <div style={{ position: "sticky", top: 0, background: "#fff", padding: "14px 16px", borderBottom: "1.5px solid #f1ead9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>Notifications</span>
            {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)" }}>Mark all read</button>}
          </div>

          {items.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center" }}>
              <Icon name="bell" size={28} color="var(--faint)" />
              <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, margin: "10px 0 0" }}>No notifications yet</p>
            </div>
          ) : (
            items.map((n) => (
              <div key={n.id} onClick={() => openItem(n)} style={{ display: "flex", gap: 12, padding: "13px 16px", borderBottom: "1px solid #f4eede", cursor: "pointer", background: n.read ? "#fff" : "#FBF6EA", alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: KIND_COLOR[n.kind] || "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={KIND_ICON[n.kind] || "bell"} size={17} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", fontWeight: n.read ? 500 : 700, lineHeight: 1.4 }}>{n.text}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--faint)", fontWeight: 600 }}>{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--coral)", flexShrink: 0, marginTop: 5 }} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
