"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "../../Logo";

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (!token) { setErr("This link is missing its token. Please use the link from your email."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/apply-reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      setBusy(false);
      if (data.error) { setErr(data.error); return; }
      setDone(true);
    } catch (e) { setBusy(false); setErr("Something went wrong. Please try again."); }
  };

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "40px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 28 }}><Logo height={36} /></div>

        {done ? (
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>Password updated</h1>
            <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, lineHeight: 1.5, marginBottom: 24 }}>You can now log in with your new password.</p>
            <button onClick={() => router.replace("/app")} style={btn}>Go to login</button>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>Choose a new password</h1>
            <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, lineHeight: 1.5, marginBottom: 22 }}>Enter a new password for your account.</p>
            {err && <div style={{ background: "#FDE8E6", color: "#A32D2D", fontWeight: 700, fontSize: 13, padding: "11px 14px", borderRadius: 12, marginBottom: 14 }}>{err}</div>}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" style={inp} />
            <button onClick={submit} disabled={busy} style={{ ...btn, marginTop: 14, opacity: busy ? 0.6 : 1 }}>{busy ? "Updating…" : "Update password"}</button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResetPage() {
  return <Suspense fallback={<main style={{ minHeight: "100dvh", background: "var(--cream)" }} />}><ResetInner /></Suspense>;
}

const inp = { width: "100%", padding: "15px 18px", fontSize: 15, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 16, background: "#fff", color: "var(--ink)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const btn = { width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 28, padding: "16px", fontSize: 16, fontWeight: 800, cursor: "pointer" };
