"use client";

import { usePathname, useRouter } from "next/navigation";
import Logo from "../Logo";

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
    <div style={{ minHeight: "100dvh", background: "var(--cream)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1.5px solid #efe7d6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Logo height={24} />
            <span style={{ background: "var(--coral)", color: "#4A1B0C", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 10 }}>ADMIN</span>
          </div>
          <button onClick={() => router.push("/app/home")} style={{ fontSize: 13.5, fontWeight: 700, color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>← Back to app</button>
        </header>

        <nav style={{ display: "flex", gap: 6, padding: "14px 14px 0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <button key={t.href} onClick={() => router.push(t.href)} style={{
                flexShrink: 0, padding: "9px 16px", borderRadius: 999, fontSize: 13.5, fontWeight: 800, cursor: "pointer",
                border: active ? "none" : "1.5px solid #e8dfcc",
                background: active ? "var(--ink)" : "#fff",
                color: active ? "#fff" : "var(--muted)",
              }}>{t.label}</button>
            );
          })}
        </nav>

        <div style={{ padding: "20px 14px 40px" }}>{children}</div>
      </div>
    </div>
  );
}
