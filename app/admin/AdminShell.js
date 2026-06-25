"use client";

import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { key: "", label: "Overview", href: "/admin" },
  { key: "collabs", label: "Collabs", href: "/admin/collabs" },
  { key: "messages", label: "Messages", href: "/admin/messages" },
  { key: "verify", label: "Verify", href: "/admin/verify" },
  { key: "users", label: "Users", href: "/admin/users" },
  { key: "showcase", label: "Showcase", href: "/admin/showcase" },
  { key: "deals", label: "Deals", href: "/admin/deals" },
  { key: "payouts", label: "Payouts", href: "/admin/payouts" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div style={{ minHeight: "100dvh", background: "radial-gradient(1200px 500px at 50% -10%, #2a2536 0%, #14121b 45%, #0d0b12 100%)" }}>
      {/* top command bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(13,11,18,0.82)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Hype<span style={{ color: "#9b8cff" }}>panda</span>
            </span>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "#0d0b12",
              background: "linear-gradient(95deg,#9b8cff,#5BA9E8)", padding: "3px 8px", borderRadius: 8,
            }}>ADMIN</span>
          </div>
          <button onClick={() => router.push("/app/home")} style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer" }}>← App</button>
        </div>

        {/* nav pills — horizontal scroll on mobile */}
        <nav style={{ maxWidth: 1040, margin: "0 auto", display: "flex", gap: 6, padding: "0 12px 12px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <button key={t.href} onClick={() => router.push(t.href)} style={{
                flexShrink: 0, padding: "9px 16px", borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.1)",
                background: active ? "linear-gradient(95deg,#9b8cff,#5BA9E8)" : "rgba(255,255,255,0.04)",
                color: active ? "#0d0b12" : "rgba(255,255,255,0.7)",
                transition: "all 0.15s",
              }}>{t.label}</button>
            );
          })}
        </nav>
      </header>

      {/* content surface */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "16px 12px 40px" }}>
        <div className="admin-surface" style={{
          background: "rgba(255,255,255,0.97)", borderRadius: 20, padding: "20px 16px",
          border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          minHeight: "60dvh",
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
