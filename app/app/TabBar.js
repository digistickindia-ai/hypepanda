"use client";

import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { key: "home", label: "Home", href: "/app/home", icon: "M3 11l9-8 9 8M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" },
  { key: "chat", label: "Chat", href: "/app/chat", icon: "M21 11.5a8.38 8.38 0 01-9 8.5 8.38 8.38 0 01-4-1L3 20l1.5-4.5A8.38 8.38 0 0112 3a8.5 8.5 0 019 8.5z" },
  { key: "reels", label: "Reels", href: "/app/reels", center: true, icon: "M3 8l4-4M10 8l4-4M3 8h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1zM3 8l3.5-4h11L21 8M11 12l4 2.5-4 2.5z" },
  { key: "deals", label: "Deals", href: "/app/deals", icon: "M20 12V8H6a2 2 0 010-4h12v4M4 6v12a2 2 0 002 2h14v-4M18 12a2 2 0 000 4h4v-4z" },
  { key: "profile", label: "Profile", href: "/app/profile", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      style={{
        flexShrink: 0,
        background: "#fff",
        borderTop: "1.5px solid #efe7d6",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 18px calc(10px + env(safe-area-inset-bottom))",
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");

        if (t.center) {
          return (
            <button
              key={t.key}
              onClick={() => router.push(t.href)}
              aria-label="Reels"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 44,
                borderRadius: 16,
                background: active ? "var(--coral)" : "#1c1c1c",
                flexShrink: 0,
                transition: "transform 0.12s ease",
              }}
              className="pressable"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="M10 9l5 3-5 3z" fill="#fff" stroke="none" />
              </svg>
            </button>
          );
        }

        return (
          <button
            key={t.key}
            onClick={() => router.push(t.href)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              width: 60,
              color: active ? "var(--ink)" : "#b3a994",
              flexShrink: 0,
            }}
          >
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            <span style={{ fontSize: 11, fontWeight: active ? 800 : 600, lineHeight: 1 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
