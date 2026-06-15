"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

const FACES = Array.from({ length: 17 }, (_, i) => `/faces/c${i + 1}.jpg`);

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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app/home?role=${role}` },
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
          <Column imgs={FACES.slice(6, 12)} dur={32} reverse />
          <Column imgs={FACES.slice(11, 17)} dur={29} />
        </div>

        {/* Cream fade over lower half so text is readable */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "62%", background: "linear-gradient(to bottom, rgba(251,243,228,0) 0%, var(--cream) 42%)" }} />

        {/* Content */}
        <div style={{ position: "relative", marginTop: "auto", padding: "0 28px 40px", textAlign: "center" }}>
          <div className="blob" style={{ marginBottom: 4 }}>
            <svg width="84" height="84" viewBox="0 0 180 190" style={{ margin: "0 auto", display: "block" }}>
              <ellipse cx="90" cy="118" rx="68" ry="64" fill="#fff" stroke="#1c1c1c" strokeWidth="4" />
              <ellipse cx="42" cy="62" rx="26" ry="28" fill="#1c1c1c" /><ellipse cx="138" cy="62" rx="26" ry="28" fill="#1c1c1c" />
              <ellipse cx="42" cy="64" rx="13" ry="15" fill="#7B6CD9" /><ellipse cx="138" cy="64" rx="13" ry="15" fill="#7B6CD9" />
              <ellipse cx="62" cy="106" rx="26" ry="22" fill="#1c1c1c" /><ellipse cx="118" cy="106" rx="26" ry="22" fill="#1c1c1c" />
              <rect x="40" y="98" width="100" height="20" rx="10" fill="#1c1c1c" />
              <rect x="46" y="100" width="38" height="15" rx="7" fill="#7B6CD9" /><rect x="96" y="100" width="38" height="15" rx="7" fill="#7B6CD9" />
              <ellipse cx="90" cy="138" rx="9" ry="6" fill="#1c1c1c" />
              <path d="M76 152 Q90 164 104 152" stroke="#1c1c1c" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M104 150 L128 142" stroke="#7BC47F" strokeWidth="5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1.5px", color: "var(--ink)", margin: "0 0 6px" }}>HypePanda</h1>
          <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, marginBottom: 22 }}>Where brands &amp; creators meet</p>

          <button className="pressable" onClick={signInWithGoogle} style={{ width: "100%", background: "#fff", color: "var(--ink)", border: "2.5px solid var(--ink)", borderRadius: 32, padding: "16px", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ color: "#EA4335", fontWeight: 800, fontSize: 19 }}>G</span> Sign in with Google
          </button>
          <button className="pressable" onClick={() => alert("Apple sign-in needs an Apple Developer account ($99/yr). Google works now.")} style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "2.5px solid var(--ink)", borderRadius: 32, padding: "16px", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: 19 }}>&#63743;</span> Sign in with Apple
          </button>
          <p style={{ fontSize: 13, color: "var(--faint)", marginTop: 20 }}>by Digistick</p>
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
