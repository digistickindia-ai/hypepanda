"use client";

import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { key: "home", label: "Home", href: "/app/home", icon: "M3 11l9-8 9 8M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" },
  { key: "chat", label: "Chat", href: "/app/chat", icon: "M21 11.5a8.38 8.38 0 01-9 8.5 8.38 8.38 0 01-4-1L3 20l1.5-4.5A8.38 8.38 0 0112 3a8.5 8.5 0 019 8.5z" },
  { key: "reels", label: "Reels", href: "/app/reels", center: true, icon: "M4 4h16v16H4zM4 9h16M9 4v5M15 4v5M10 13l4 2.5-4 2.5z" },
  { key: "deals", label: "Deals", href: "/app/deals", icon: "M20 12V8H6a2 2 0 010-4h12v4M4 6v12a2 2 0 002 2h14v-4M18 12a2 2 0 000 4h4v-4z" },
  { key: "profile", label: "Profile", href: "/app/profile", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1.5px solid #efe7d6", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 8px calc(8px + env(safe-area-inset-bottom))", maxWidth: 480, margin: "0 auto" }}>
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");

        if (t.center) {
          return (
            <button key={t.key} onClick={() => router.push(t.href)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
              <div style={{ width: 50, height: 38, borderRadius: 14, background: active ? "var(--coral)" : "#1c1c1c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: active ? "var(--coral)" : "var(--ink)" }}>{t.label}</span>
            </button>
          );
        }

        return (
          <button key={t.key} onClick={() => router.push(t.href)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1, color: active ? "var(--ink)" : "#b3a994" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
            <span style={{ fontSize: 11, fontWeight: active ? 800 : 600 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
