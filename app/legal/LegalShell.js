"use client";

import { useRouter } from "next/navigation";
import Logo from "../Logo";

export default function LegalShell({ title, updated, children }) {
  const router = useRouter();
  return (
    <main style={{ background: "var(--cream)", minHeight: "100dvh" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 22px 60px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 20px", borderBottom: "1.5px solid #efe7d6", marginBottom: 28 }}>
          <div onClick={() => router.push("/")} style={{ cursor: "pointer" }}><Logo height={32} /></div>
          <button onClick={() => router.push("/")} style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>← Home</button>
        </header>

        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--ink)", margin: "0 0 4px" }}>{title}</h1>
        {updated && <p style={{ fontSize: 13, color: "var(--faint)", fontWeight: 600, margin: "0 0 24px" }}>Last updated: {updated}</p>}

        <div style={{ fontSize: 15, lineHeight: 1.7, color: "#3a352e" }}>{children}</div>

        <footer style={{ marginTop: 48, paddingTop: 20, borderTop: "1.5px solid #efe7d6", fontSize: 13, color: "var(--faint)", lineHeight: 1.6 }}>
          HypePanda is a brand owned and operated by Digistick Services Private Limited.<br />
          Sector 68, Noida, Uttar Pradesh, India · © 2026 Digistick Services Private Limited. All rights reserved.
        </footer>
      </div>
    </main>
  );
}

// Shared sub-components for consistent styling
export function H2({ children }) {
  return <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--ink)", margin: "28px 0 10px" }}>{children}</h2>;
}
export function P({ children }) {
  return <p style={{ margin: "0 0 14px" }}>{children}</p>;
}
export function LI({ children }) {
  return <li style={{ margin: "0 0 8px" }}>{children}</li>;
}
