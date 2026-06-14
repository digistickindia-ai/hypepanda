"use client";

export default function WelcomePage() {
  const handleSignIn = (provider) => {
    // Wired to real auth in the next build step (Supabase).
    alert(
      `${provider} sign-in will be connected next.\n\nRight now this is your live welcome screen — the real login gets added when we set up the database.`
    );
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--cream)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          padding: "0 0 32px",
        }}
      >
        {/* Top bar with back link */}
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px 0" }}>
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--muted)",
              textDecoration: "none",
            }}
          >
            ← Back
          </a>
        </div>

        {/* Logo */}
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <span
            style={{
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: "-2px",
              color: "var(--ink)",
            }}
          >
            HypePanda
          </span>
        </div>

        {/* Hero illustration */}
        <div style={{ position: "relative", flex: 1, minHeight: 380 }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 380 400"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block" }}
          >
            {/* green blob top-left */}
            <g className="blob" style={{ animationDelay: "0s" }}>
              <circle cx="70" cy="130" r="52" fill="var(--green)" />
              <circle cx="60" cy="122" r="10" fill="#fff" />
              <circle cx="62" cy="124" r="5" fill="var(--ink)" />
              <circle cx="84" cy="122" r="10" fill="#fff" />
              <circle cx="86" cy="124" r="5" fill="var(--ink)" />
              <path d="M60 146 Q73 158 90 144" stroke="var(--ink)" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>

            {/* coral blob top-right */}
            <g className="blobSlow" style={{ animationDelay: "0.4s" }}>
              <circle cx="312" cy="112" r="56" fill="var(--coral)" />
              <circle cx="300" cy="104" r="11" fill="#fff" />
              <circle cx="302" cy="106" r="5.5" fill="var(--ink)" />
              <circle cx="326" cy="104" r="11" fill="#fff" />
              <circle cx="328" cy="106" r="5.5" fill="var(--ink)" />
              <path d="M298 130 Q314 146 332 128" stroke="var(--ink)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </g>

            {/* pink small blob top-center */}
            <g className="blob" style={{ animationDelay: "0.9s" }}>
              <circle cx="190" cy="62" r="34" fill="var(--pink)" />
              <ellipse cx="181" cy="58" rx="4" ry="8" fill="var(--ink)" />
              <ellipse cx="199" cy="58" rx="4" ry="8" fill="var(--ink)" />
            </g>

            {/* blue blob bottom-left */}
            <g className="blobSlow" style={{ animationDelay: "0.2s" }}>
              <circle cx="66" cy="300" r="54" fill="var(--blue)" />
              <circle cx="54" cy="293" r="11" fill="#fff" />
              <circle cx="56" cy="295" r="5.5" fill="var(--ink)" />
              <circle cx="80" cy="293" r="11" fill="#fff" />
              <circle cx="82" cy="295" r="5.5" fill="var(--ink)" />
              <path d="M52 318 Q68 332 86 316" stroke="var(--ink)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </g>

            {/* yellow blob bottom-right with eyebrows */}
            <g className="blob" style={{ animationDelay: "0.6s" }}>
              <circle cx="314" cy="296" r="58" fill="var(--yellow)" />
              <path d="M282 274 Q295 263 308 276" stroke="var(--ink)" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M320 276 Q333 263 346 276" stroke="var(--ink)" strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="294" cy="294" r="10" fill="#fff" />
              <circle cx="296" cy="296" r="5" fill="var(--ink)" />
              <circle cx="334" cy="294" r="10" fill="#fff" />
              <circle cx="332" cy="296" r="5" fill="var(--ink)" />
              <path d="M300 316 Q314 328 328 314" stroke="var(--ink)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </g>

            {/* squiggle connector */}
            <path
              d="M112 175 Q160 140 172 188 Q184 232 138 238 Q172 250 200 226"
              stroke="var(--ink)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="0.1 10"
              opacity="0.5"
            />

            {/* PANDA mascot center */}
            <g className="blob" style={{ animationDelay: "0.3s" }}>
              <ellipse cx="190" cy="212" rx="64" ry="60" fill="#fff" stroke="var(--ink)" strokeWidth="3.5" />
              {/* ears */}
              <ellipse cx="146" cy="172" rx="22" ry="24" fill="var(--ink)" />
              <ellipse cx="234" cy="172" rx="22" ry="24" fill="var(--ink)" />
              {/* eye patches */}
              <ellipse cx="166" cy="206" rx="19" ry="22" fill="var(--ink)" />
              <circle cx="161" cy="201" r="7" fill="#fff" />
              <ellipse cx="214" cy="206" rx="19" ry="22" fill="var(--ink)" />
              <circle cx="209" cy="201" r="7" fill="#fff" />
              {/* nose + smile */}
              <ellipse cx="190" cy="228" rx="8" ry="6" fill="var(--ink)" />
              <path d="M178 242 Q190 252 202 242" stroke="var(--ink)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </g>

            {/* Hello bubble */}
            <g className="bubble" transform="translate(228 250)">
              <rect x="0" y="0" width="104" height="44" rx="22" fill="var(--ink)" />
              <path d="M20 44 L14 58 L34 44 Z" fill="var(--ink)" />
              <text x="52" y="29" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700" fontFamily="-apple-system, system-ui, sans-serif">
                Hello~
              </text>
            </g>
          </svg>
        </div>

        {/* Sign in */}
        <div style={{ padding: "0 28px", textAlign: "center" }}>
          <p style={{ fontSize: 16, color: "var(--muted)", fontWeight: 500, marginBottom: 20 }}>
            Sign in to get started
          </p>

          <button
            className="pressable"
            onClick={() => handleSignIn("Google")}
            style={{
              width: "100%",
              background: "#fff",
              color: "var(--ink)",
              border: "2.5px solid var(--ink)",
              borderRadius: 32,
              padding: "16px",
              fontSize: 17,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <span style={{ color: "#EA4335", fontWeight: 800, fontSize: 19 }}>G</span>
            Sign in with Google
          </button>

          <button
            className="pressable"
            onClick={() => handleSignIn("Apple")}
            style={{
              width: "100%",
              background: "var(--ink)",
              color: "#fff",
              border: "2.5px solid var(--ink)",
              borderRadius: 32,
              padding: "16px",
              fontSize: 17,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 19 }}></span>
            Sign in with Apple
          </button>

          <p style={{ fontSize: 13, color: "var(--faint)", marginTop: 22 }}>by Digistick</p>
        </div>
      </div>
    </main>
  );
}
