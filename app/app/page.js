"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Logo from "../Logo";

const FACES = Array.from({ length: 16 }, (_, i) => `/faces/c${i + 1}.jpg`);

function Column({ imgs, dur, reverse }) {
  const doubled = [...imgs, ...imgs];
  return (
    <div style={{ flex: 1, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: `scroll${reverse ? "Down" : "Up"} ${dur}s linear infinite` }}>
        {doubled.map((src, i) => (
          <div key={i} style={{ width: "100%", aspectRatio: "3/4", borderRadius: 16, overflow: "hidden", background: "#e8dfcc", flexShrink: 0 }}>
            <img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SignInInner() {
  const params = useSearchParams();
  const role = params.get("role") || "creator";

  const signInWithGoogle = async () => {
    const supabase = createClient();
    const next = encodeURIComponent(`/app/home?role=${role}`);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    });
    if (error) alert("Sign-in error: " + error.message);
  };

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", justifyContent: "center", overflow: "hidden" }}>
      <style>{`
        @keyframes scrollUp { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        @keyframes scrollDown { from { transform: translateY(-50%); } to { transform: translateY(0); } }
      `}</style>
      <div style={{ width: "100%", maxWidth: 440, position: "relative", display: "flex", flexDirection: "column" }}>

        {/* Scrolling photo wall */}
        <div style={{ position: "absolute", inset: 0, display: "flex", gap: 10, padding: "0 12px", opacity: 0.9 }}>
          <Column imgs={FACES.slice(0, 6)} dur={26} />
          <Column imgs={FACES.slice(6, 11)} dur={32} reverse />
          <Column imgs={FACES.slice(11, 16)} dur={29} />
        </div>

        {/* Cream fade over lower half so text is readable */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "62%", background: "linear-gradient(to bottom, rgba(251,243,228,0) 0%, var(--cream) 42%)" }} />

        {/* Content */}
        <div style={{ position: "relative", marginTop: "auto", padding: "0 28px 40px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
            <Logo height={88} />
          </div>
          <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, marginBottom: 22, marginTop: 8 }}>Where brands &amp; creators meet</p>

          <button className="pressable" onClick={signInWithGoogle} style={{ width: "100%", background: "#fff", color: "var(--ink)", border: "2.5px solid var(--ink)", borderRadius: 32, padding: "16px", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ color: "#EA4335", fontWeight: 800, fontSize: 19 }}>G</span> Sign in with Google
          </button>
          <button className="pressable" onClick={() => window.location.href = "/app/email?role=" + role} style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "2.5px solid var(--ink)", borderRadius: 32, padding: "16px", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></svg> Continue with email
          </button>
          <p style={{ fontSize: 12, color: "var(--faint)", marginTop: 16, lineHeight: 1.5 }}>
            By continuing you agree to our{" "}
            <a href="/legal/terms" style={{ color: "var(--muted)", fontWeight: 600 }}>Terms</a> and{" "}
            <a href="/legal/privacy" style={{ color: "var(--muted)", fontWeight: 600 }}>Privacy Policy</a>.
          </p>
          <p style={{ fontSize: 13, color: "var(--faint)", marginTop: 14 }}>by Digistick</p>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100dvh", background: "var(--cream)" }} />}>
      <SignInInner />
    </Suspense>
  );
}
