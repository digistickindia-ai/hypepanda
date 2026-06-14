"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadMe, inr } from "@/lib/me";
import TabBar from "../TabBar";

export default function ChatList() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [others, setOthers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const res = await loadMe(router);
    if (!res) return;
    setMe(res);
    const isCreator = res.profile.role === "creator";
    const col = isCreator ? "creator_id" : "business_id";
    const { data: deals } = await res.supabase.from("deals").select("*").eq(col, res.profile.id).order("updated_at", { ascending: false });
    const list = deals || [];
    setRows(list);
    const ids = [...new Set(list.map((d) => isCreator ? d.business_id : d.creator_id))];
    if (ids.length) {
      const { data: profs } = await res.supabase.from("profiles").select("id, full_name, company_name").in("id", ids);
      const map = {}; (profs || []).forEach((p) => { map[p.id] = p; });
      setOthers(map);
    }
    setLoading(false);
  })(); }, []);

  return (
    <div style={{ height: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "28px 22px 20px", overflowY: "auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", margin: "0 0 20px" }}>Messages</h1>
        {loading ? (
          <p style={{ color: "var(--muted)", fontWeight: 600, textAlign: "center", marginTop: 30 }}>Loading…</p>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div className="blob" style={{ marginBottom: 14 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ margin: "0 auto" }}>
                <circle cx="40" cy="40" r="32" fill="var(--green)" />
                <circle cx="31" cy="35" r="6" fill="#fff" /><circle cx="32" cy="36" r="3" fill="var(--ink)" />
                <circle cx="49" cy="35" r="6" fill="#fff" /><circle cx="50" cy="36" r="3" fill="var(--ink)" />
                <path d="M31 50 Q40 58 49 48" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>No conversations yet</div>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>Your chats open up when a deal starts.</div>
          </div>
        ) : (
          rows.map((d) => {
            const isCreator = me.profile.role === "creator";
            const o = others[isCreator ? d.business_id : d.creator_id] || {};
            const nm = o.company_name || o.full_name || "—";
            const init = nm.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            return (
              <div key={d.id} onClick={() => router.push("/app/chat/" + d.id)} className="pressable" style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 18, padding: 14, border: "1.5px solid #efe7d6", marginBottom: 10, cursor: "pointer" }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{init}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{nm}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--coral)" }}>{inr(d.amount)}</span>
              </div>
            );
          })
        )}
      </div>
      <TabBar />
    </div>
  );
}
