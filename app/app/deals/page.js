"use client";
import TabBar from "../TabBar";
export default function Page() {
  const label = "deals" === "chat" ? "Messages" : "Deals";
  const sub = "deals" === "chat" ? "Your conversations with brands will live here." : "Active and past collabs will show up here.";
  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ flex: 1, padding: "28px 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div className="blob" style={{ marginBottom: 16 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="var(--green)" />
            <circle cx="31" cy="35" r="6" fill="#fff" /><circle cx="32" cy="36" r="3" fill="var(--ink)" />
            <circle cx="49" cy="35" r="6" fill="#fff" /><circle cx="50" cy="36" r="3" fill="var(--ink)" />
            <path d="M31 50 Q40 58 49 48" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: 0 }}>{label}</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500, marginTop: 8, maxWidth: 240 }}>{sub}</p>
      </div>
      <TabBar />
    </div>
  );
}
