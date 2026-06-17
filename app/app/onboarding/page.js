"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { NICHES } from "@/lib/me";

function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [role, setRole] = useState("creator");
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("");
  const [handle, setHandle] = useState("");
  const [followers, setFollowers] = useState("");
  const [rate, setRate] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    const r = params.get("role");
    if (r === "business" || r === "agency" || r === "creator") setRole(r);
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/app"); return; }
      setUser(data.user);
      setName(data.user.user_metadata?.full_name || "");
    });
  }, []);

  const isCreator = role === "creator";

  const steps = isCreator
    ? [
        { title: "What's your name?" },
        { title: "Where are you based?" },
        { title: "Pick your niche" },
        { title: "Your Instagram handle" },
        { title: "Set your rate" },
      ]
    : [
        { title: "What's your name?" },
        { title: "Company / brand name" },
        { title: "Where are you based?" },
        { title: "What do you look for?" },
      ];

  const canNext = () => {
    if (isCreator) {
      if (step === 0) return name.trim().length > 1;
      if (step === 1) return city.trim().length > 1;
      if (step === 2) return niche !== "";
      if (step === 3) return handle.trim().length > 1;
      if (step === 4) return rate !== "" && Number(rate) > 0;
    } else {
      if (step === 0) return name.trim().length > 1;
      if (step === 1) return company.trim().length > 1;
      if (step === 2) return city.trim().length > 1;
      if (step === 3) return niche !== "";
    }
    return false;
  };

  const finish = async () => {
    setSaving(true);
    const payload = isCreator
      ? {
          role: "creator", full_name: name.trim(), city: city.trim(), niche,
          instagram_handle: handle.replace("@", "").trim(),
          followers: followers ? Number(followers) : null,
          email: user.email,
          rate_per_post: Number(rate), onboarding_done: true,
        }
      : {
          role, full_name: name.trim(), company_name: company.trim(),
          city: city.trim(), niche, email: user.email, onboarding_done: true,
        };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setSaving(false);
    if (error) { alert("Couldn't save: " + error.message); return; }
    // Creators must add showcase videos before reaching home.
    if (isCreator) { router.replace("/app/onboarding/showcase"); return; }
    router.replace("/app/home");
  };

  const next = () => { step < steps.length - 1 ? setStep(step + 1) : finish(); };

  const accents = ["var(--green)", "var(--blue)", "var(--pink)", "var(--coral)", "var(--yellow)"];
  const accent = accents[step % accents.length];

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", padding: "0 24px 32px" }}>

        <div style={{ display: "flex", gap: 6, paddingTop: 24, marginBottom: 8 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= step ? accent : "#e8dfcc", transition: "background 0.3s" }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : router.push("/")} style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>&#8592; Back</button>
          <span style={{ fontSize: 13, color: "var(--faint)", fontWeight: 600 }}>{step + 1} of {steps.length}</span>
        </div>

        <svg width="100%" height="116" viewBox="0 0 120 120" style={{ display: "block", margin: "0 auto 6px", maxWidth: 116 }}>
          <g className="blob">
            <circle cx="60" cy="60" r="46" fill={accent} />
            <circle cx="48" cy="54" r="9" fill="#fff" /><circle cx="50" cy="56" r="4.5" fill="var(--ink)" />
            <circle cx="72" cy="54" r="9" fill="#fff" /><circle cx="74" cy="56" r="4.5" fill="var(--ink)" />
            <path d="M48 74 Q60 86 76 72" stroke="var(--ink)" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        </svg>

        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", textAlign: "center", margin: "0 0 24px" }}>{steps[step].title}</h1>

        <div style={{ flex: 1 }}>
          {/* name */}
          {step === 0 && (
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
          )}

          {isCreator ? (
            <>
              {step === 1 && <input autoFocus value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai, Noida" style={inputStyle} />}
              {step === 2 && <NichePicker niche={niche} setNiche={setNiche} accent={accent} />}
              {step === 3 && (
                <div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 18, top: 16, fontSize: 17, fontWeight: 700, color: "var(--faint)" }}>@</span>
                    <input autoFocus value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourhandle" style={{ ...inputStyle, paddingLeft: 38 }} />
                  </div>
                  <input type="number" value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="Follower count (e.g. 12000)" style={{ ...inputStyle, marginTop: 12 }} />
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, lineHeight: 1.5, fontWeight: 500 }}>
                    Enter your follower count for now — brands can tap your handle to check your profile. Instagram auto-verification is coming soon to confirm it with a badge.
                  </p>
                </div>
              )}
              {step === 4 && (
                <div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 18, top: 16, fontSize: 17, fontWeight: 700, color: "var(--faint)" }}>&#8377;</span>
                    <input autoFocus type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="5000" style={{ ...inputStyle, paddingLeft: 34 }} />
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, fontWeight: 500 }}>Your starting rate per post. Change it anytime.</p>
                </div>
              )}
            </>
          ) : (
            <>
              {step === 1 && <input autoFocus value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Glocery, Epikami" style={inputStyle} />}
              {step === 2 && <input autoFocus value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai, Noida" style={inputStyle} />}
              {step === 3 && <NichePicker niche={niche} setNiche={setNiche} accent={accent} />}
            </>
          )}
        </div>

        <button className="pressable" disabled={!canNext() || saving} onClick={next} style={{
          width: "100%", background: canNext() ? "var(--ink)" : "#d8cfbc", color: "#fff",
          border: "none", borderRadius: 32, padding: "17px", fontSize: 17, fontWeight: 800,
          marginTop: 20, cursor: canNext() ? "pointer" : "default",
        }}>
          {saving ? "Saving..." : step === steps.length - 1 ? "Finish" : "Continue"}
        </button>
      </div>
    </main>
  );
}

function NichePicker({ niche, setNiche, accent }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {NICHES.map((n) => (
        <button key={n} onClick={() => setNiche(n)} style={{
          padding: "12px 18px", borderRadius: 22, fontSize: 15, fontWeight: 700,
          border: niche === n ? "2.5px solid var(--ink)" : "2.5px solid #e8dfcc",
          background: niche === n ? accent : "#fff", color: "var(--ink)",
        }}>{n}</button>
      ))}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "15px 18px", fontSize: 17, fontWeight: 600,
  border: "2.5px solid #e8dfcc", borderRadius: 18, background: "#fff",
  color: "var(--ink)", outline: "none", fontFamily: "inherit",
};

export default function Onboarding() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100dvh", background: "var(--cream)" }} />}>
      <OnboardingInner />
    </Suspense>
  );
}
