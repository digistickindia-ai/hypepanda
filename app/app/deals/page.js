"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadMe, inr } from "@/lib/me";
import TabBar from "../TabBar";

const STATUS_LABEL = {
  pending: "Pending", accepted: "Accepted", declined: "Declined",
  in_progress: "In progress", delivered: "Delivered", completed: "Completed", cancelled: "Cancelled",
};
const STATUS_COLOR = {
  pending: "var(--yellow)", accepted: "var(--green)", declined: "#e0d8c8",
  in_progress: "var(--blue)", delivered: "var(--pink)", completed: "var(--green)", cancelled: "#e0d8c8",
};

export default function Deals() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [deals, setDeals] = useState([]);
  const [others, setOthers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const res = await loadMe(router);
    if (!res) return;
    setMe(res);
    const isCreator = res.profile.role === "creator";
    const col = isCreator ? "creator_id" : "business_id";
    const { data } = await res.supabase.from("deals").select("*").eq(col, res.profile.id).order("updated_at", { ascending: false });
    const list = data || [];
    setDeals(list);
    const otherIds = [...new Set(list.map((d) => isCreator ? d.business_id : d.creator_id))];
    if (otherIds.length) {
      const { data: profs } = await res.supabase.from("profiles").select("id, full_name, company_name, niche").in("id", otherIds);
      const map = {};
      (profs || []).forEach((p) => { map[p.id] = p; });
      setOthers(map);
    }
    setLoading(false);
  })(); }, []);

  return (
    <div style={{ height: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "28px 22px 20px", overflowY: "auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", margin: "0 0 20px" }}>Deals</h1>

        {loading ? (
          <p style={{ color: "var(--muted)", fontWeight: 600, textAlign: "center", marginTop: 30 }}>Loading…</p>
        ) : deals.length === 0 ? (
          <Empty isCreator={me.profile.role === "creator"} />
        ) : (
          deals.map((d) => {
            const isCreator = me.profile.role === "creator";
            const other = others[isCreator ? d.business_id : d.creator_id] || {};
            const otherName = other.company_name || other.full_name || "—";
            return (
              <div key={d.id} onClick={() => router.push("/app/chat/" + d.id)} className="pressable" style={{ background: "#fff", borderRadius: 20, padding: 18, border: "1.5px solid #efe7d6", marginBottom: 12, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{d.title}</div>
                  <span style={{ background: STATUS_COLOR[d.status], color: "#1c1c1c", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 12, whiteSpace: "nowrap" }}>{STATUS_LABEL[d.status]}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{isCreator ? "From" : "To"} {otherName}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "var(--coral)" }}>{inr(d.amount)}</span>
                  {d.payment_status === "secured" && <span style={{ fontSize: 12, fontWeight: 700, color: "#185FA5" }}>💰 Payment secured</span>}
                  {d.payment_status === "paid_out" && <span style={{ fontSize: 12, fontWeight: 700, color: "#3B6D11" }}>✓ Paid out</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
      <TabBar />
    </div>
  );
}

function Empty({ isCreator }) {
  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <div className="blob" style={{ marginBottom: 14 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ margin: "0 auto" }}>
          <circle cx="40" cy="40" r="32" fill="var(--coral)" />
          <circle cx="31" cy="35" r="6" fill="#fff" /><circle cx="32" cy="36" r="3" fill="var(--ink)" />
          <circle cx="49" cy="35" r="6" fill="#fff" /><circle cx="50" cy="36" r="3" fill="var(--ink)" />
          <path d="M31 50 Q40 58 49 48" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>No deals yet</div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 4, maxWidth: 250, margin: "4px auto 0" }}>
        {isCreator ? "When a brand sends you a collab offer, it shows up here." : "Find a creator and send your first collab offer."}
      </div>
    </div>
  );
}
