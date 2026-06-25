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
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1.5px solid #efe7d6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo height={26} />
            <span style={{ background: "var(--coral)", color: "#4A1B0C", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 12 }}>ADMIN</span>
          </div>
          <button onClick={() => router.push("/app/home")} style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>← Back to app</button>
        </header>

        <nav style={{ display: "flex", gap: 6, padding: "16px 24px 0", overflowX: "auto" }}>
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <button key={t.href} onClick={() => router.push(t.href)} style={{
                flexShrink: 0, padding: "10px 18px", borderRadius: "16px 16px 0 0", fontSize: 14, fontWeight: 800,
                border: "none", background: active ? "#fff" : "transparent", color: active ? "var(--ink)" : "var(--muted)",
                borderBottom: active ? "3px solid var(--coral)" : "3px solid transparent",
              }}>{t.label}</button>
            );
          })}
        </nav>

        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}
