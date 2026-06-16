"use client";

import Logo from "./Logo";

function Blob({ children, delay = 0, slow = false }) {
  return (
    <g className={slow ? "blobSlow" : "blob"} style={{ animationDelay: `${delay}s` }}>
      {children}
    </g>
  );
}

export default function Landing() {
  return (
    <main style={{ background: "var(--cream)", minHeight: "100dvh" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px" }}>
          <Logo height={44} />
        </nav>

        <section style={{ padding: "16px 24px 0", textAlign: "center" }}>
          <span style={{ display: "inline-block", background: "var(--green)", color: "#173404", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 16, marginBottom: 18 }}>&#10022; India&apos;s playful home of creators</span>
          <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.04, letterSpacing: "-1.5px", color: "var(--ink)", margin: 0 }}>
            Brands &amp; creators,<br />finally in <span style={{ color: "var(--coral)" }}>one place</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 500, margin: "16px 0 0" }}>Verified audiences. Real deals. Zero awkward DMs.</p>
        </section>

        <section style={{ padding: "8px 0" }}>
          <svg width="100%" height="150" viewBox="0 0 480 150" style={{ display: "block" }}>
            <Blob delay={0}>
              <circle cx="78" cy="78" r="38" fill="var(--blue)" />
              <circle cx="68" cy="72" r="7.5" fill="#fff" /><circle cx="69" cy="73" r="3.8" fill="var(--ink)" />
              <circle cx="88" cy="72" r="7.5" fill="#fff" /><circle cx="89" cy="73" r="3.8" fill="var(--ink)" />
              <path d="M68 90 Q78 100 90 88" stroke="var(--ink)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </Blob>
            <Blob delay={0.3} slow>
              <circle cx="180" cy="56" r="26" fill="var(--pink)" />
              <ellipse cx="173" cy="52" rx="3.2" ry="6" fill="var(--ink)" /><ellipse cx="187" cy="52" rx="3.2" ry="6" fill="var(--ink)" />
            </Blob>
            <Blob delay={0.15}>
              <ellipse cx="240" cy="80" rx="48" ry="45" fill="#fff" stroke="var(--ink)" strokeWidth="3" />
              <ellipse cx="206" cy="50" rx="16" ry="17" fill="var(--ink)" /><ellipse cx="274" cy="50" rx="16" ry="17" fill="var(--ink)" />
              <ellipse cx="206" cy="51" rx="8" ry="9" fill="#7B6CD9" /><ellipse cx="274" cy="51" rx="8" ry="9" fill="#7B6CD9" />
              <ellipse cx="220" cy="76" rx="17" ry="14" fill="var(--ink)" /><ellipse cx="260" cy="76" rx="17" ry="14" fill="var(--ink)" />
              <rect x="201" y="69" width="78" height="14" rx="7" fill="var(--ink)" />
              <rect x="205" y="71" width="29" height="10" rx="5" fill="#7B6CD9" /><rect x="246" y="71" width="29" height="10" rx="5" fill="#7B6CD9" />
              <ellipse cx="240" cy="96" rx="6" ry="4.5" fill="var(--ink)" />
              <path d="M231 104 Q240 112 249 104" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M249 103 L268 97" stroke="#7BC47F" strokeWidth="4" fill="none" strokeLinecap="round" />
            </Blob>
            <Blob delay={0.45} slow>
              <circle cx="320" cy="58" r="24" fill="var(--coral)" />
              <circle cx="312" cy="53" r="6" fill="#fff" /><circle cx="313" cy="54" r="3" fill="var(--ink)" />
              <circle cx="328" cy="53" r="6" fill="#fff" /><circle cx="329" cy="54" r="3" fill="var(--ink)" />
              <path d="M312 66 Q320 74 330 64" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
            </Blob>
            <Blob delay={0.25}>
              <circle cx="406" cy="80" r="40" fill="var(--yellow)" />
              <path d="M388 66 Q396 60 404 67" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M408 67 Q416 60 424 67" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="396" cy="80" r="7.5" fill="#fff" /><circle cx="397" cy="81" r="3.8" fill="var(--ink)" />
              <circle cx="416" cy="80" r="7.5" fill="#fff" /><circle cx="415" cy="81" r="3.8" fill="var(--ink)" />
              <path d="M398 92 Q407 102 418 90" stroke="var(--ink)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </Blob>
          </svg>
        </section>

        <section style={{ padding: "8px 22px 24px" }}>
          {[
            { label: "I'm a Creator", sub: "Grow & earn from collabs", bg: "var(--coral)", title: "#4A1B0C", subc: "#712B13", role: "creator" },
            { label: "I'm a Business", sub: "Find verified creators", bg: "var(--blue)", title: "#042C53", subc: "#0C447C", role: "business" },
            { label: "I'm an Agency", sub: "Manage brands in one place", bg: "var(--yellow)", title: "#412402", subc: "#633806", role: "agency" },
          ].map((c) => (
            <a key={c.role} href={"/app?role=" + c.role} className="pressable" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: c.bg, borderRadius: 22, padding: "20px 22px", marginBottom: 12, textDecoration: "none" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: c.title }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: c.subc, marginTop: 2 }}>{c.sub}</div>
              </div>
              <span style={{ color: c.title, fontSize: 22, fontWeight: 700 }}>&#8594;</span>
            </a>
          ))}
        </section>

        <section style={{ background: "var(--ink)", margin: "0 14px", borderRadius: 28, padding: "32px 26px", textAlign: "center" }}>
          <div style={{ color: "var(--green)", fontSize: 12, fontWeight: 700, letterSpacing: "1px", marginBottom: 10 }}>YOUR ACCOUNT IS NEVER AT RISK</div>
          <div style={{ color: "#fff", fontSize: 17, fontWeight: 600, lineHeight: 1.45 }}>We connect through Instagram&apos;s official API. We never see, store, or touch your password.</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 18, marginTop: 22 }}>
            <span style={{ background: "#E1306C", width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>&#9678;</span>
            <span style={{ color: "#666", fontSize: 20, letterSpacing: 2 }}>&#183; &#183; &#183;</span>
            <span style={{ background: "#fff", width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>&#128060;</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
            {[
              { t: "Password protected", d: "Instagram connects via secure API." },
              { t: "Real insights", d: "Follower counts come straight from Instagram." },
            ].map((x) => (
              <div key={x.t} style={{ flex: 1, textAlign: "left" }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{x.t}</div>
                <div style={{ color: "#999", fontSize: 12, fontWeight: 500, lineHeight: 1.4 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "36px 24px 8px" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", textAlign: "center", margin: "0 0 24px" }}>How it works</h2>
          {[
            { n: "1", c: "var(--pink)", tc: "#4B1528", t: "Create your profile", d: "Connect Instagram, set your niche and rate card." },
            { n: "2", c: "var(--green)", tc: "#173404", t: "Get matched", d: "Brands find you by niche, budget and audience." },
            { n: "3", c: "var(--blue)", tc: "#042C53", t: "Collab & get paid", d: "Agree, deliver, and get paid safely through escrow." },
          ].map((s) => (
            <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
              <span style={{ background: s.c, color: s.tc, width: 38, height: 38, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, flexShrink: 0 }}>{s.n}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{s.t}</div>
                <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500, marginTop: 2 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </section>

        <section style={{ padding: "16px 24px 0", textAlign: "center" }}>
          <div style={{ background: "#fff", border: "2px dashed var(--faint)", borderRadius: 20, padding: "20px" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>&#128060; Just launched</div>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginTop: 4 }}>Be one of the first creators and brands on HypePanda.</div>
          </div>
        </section>

        <section style={{ padding: "32px 24px 16px", textAlign: "center" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", margin: "0 0 16px" }}>Ready to get hyped?</h2>
          <a href="/app" className="pressable" style={{ display: "inline-block", background: "var(--coral)", color: "#4A1B0C", fontSize: 17, fontWeight: 800, padding: "16px 40px", borderRadius: 30, textDecoration: "none" }}>Join HypePanda</a>
        </section>

        <footer style={{ padding: "28px 24px 40px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Logo height={26} /></div>
          <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>by Digistick &#183; &#169; 2026</div>
        </footer>

      </div>
    </main>
  );
}
