"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const NICHES = ["Beauty", "Fashion", "Food", "Fitness", "Tech", "Travel", "Lifestyle", "Gaming", "Comedy", "Finance"];

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("");
  const [handle, setHandle] = useState("");
  const [rate, setRate] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/app"); return; }
      setUser(data.user);
      setName(data.user.user_metadata?.full_name || "");
    });
  }, []);

  const steps = [
    { title: "What's your name?", emoji: "panda" },
    { title: "Where are you based?", emoji: "blue" },
    { title: "Pick your niche", emoji: "pink" },
    { title: "Connect Instagram", emoji: "coral" },
    { title: "Set your rate", emoji: "yellow" },
  ];

  const canNext = () => {
    if (step === 0) return name.trim().length > 1;
    if (step === 1) return city.trim().length > 1;
    if (step === 2) return niche !== "";
    if (step === 3) return handle.trim().length > 1;
    if (step === 4) return rate !== "" && Number(rate) > 0;
    return false;
  };

  const finish = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      role: "creator",
      full_name: name.trim(),
      city: city.trim(),
      niche,
      instagram_handle: handle.replace("@", "").trim(),
      instagram_connected: false,
      rate_per_post: Number(rate),
      onboarding_done: true,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { alert("Couldn't save: " + error.message); return; }
    router.replace("/app/home");
  };

  const next = () => { step < steps.length - 1 ? setStep(step + 1) : finish(); };

  const accent = ["var(--green)", "var(--blue)", "var(--pink)", "var(--coral)", "var(--yellow)"][step];

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", padding: "0 24px 32px" }}>

        <div style={{ display: "flex", gap: 6, paddingTop: 24, marginBottom: 8 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= step ? accent : "#e8dfcc", transition: "background 0.3s" }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : router.back()} style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>&#8592; Back</button>
          <span style={{ fontSize: 13, color: "var(--faint)", fontWeight: 600 }}>{step + 1} of {steps.length}</span>
        </div>

        <svg width="100%" height="120" viewBox="0 0 120 120" style={{ display: "block", margin: "0 auto 8px", maxWidth: 120 }}>
          <g className="blob">
            <circle cx="60" cy="60" r="46" fill={accent} />
            <circle cx="48" cy="54" r="9" fill="#fff" /><circle cx="50" cy="56" r="4.5" fill="var(--ink)" />
            <circle cx="72" cy="54" r="9" fill="#fff" /><circle cx="74" cy="56" r="4.5" fill="var(--ink)" />
            <path d="M48 74 Q60 86 76 72" stroke="var(--ink)" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        </svg>

        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", textAlign: "center", margin: "0 0 28px" }}>{steps[step].title}</h1>

        <div style={{ flex: 1 }}>
          {step === 0 && (
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
              style={inputStyle} />
          )}
          {step === 1 && (
            <input autoFocus value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai, Noida, Bareilly"
              style={inputStyle} />
          )}
          {step === 2 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {NICHES.map((n) => (
                <button key={n} onClick={() => setNiche(n)} style={{
                  padding: "12px 18px", borderRadius: 22, fontSize: 15, fontWeight: 700,
                  border: niche === n ? "2.5px solid var(--ink)" : "2.5px solid #e8dfcc",
                  background: niche === n ? accent : "#fff",
                  color: "var(--ink)",
                }}>{n}</button>
              ))}
            </div>
          )}
          {step === 3 && (
            <div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 18, top: 16, fontSize: 17, fontWeight: 700, color: "var(--faint)" }}>@</span>
                <input autoFocus value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourhandle"
                  style={{ ...inputStyle, paddingLeft: 38 }} />
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, lineHeight: 1.5, fontWeight: 500 }}>
                For now we just save your handle. Real Instagram verification (auto follower counts) gets switched on once we set up the Instagram connection.
              </p>
            </div>
          )}
          {step === 4 && (
            <div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 18, top: 16, fontSize: 17, fontWeight: 700, color: "var(--faint)" }}>&#8377;</span>
                <input autoFocus type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="5000"
                  style={{ ...inputStyle, paddingLeft: 34 }} />
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, fontWeight: 500 }}>Your starting rate per post. You can change this anytime.</p>
            </div>
          )}
        </div>

        <button className="pressable" disabled={!canNext() || saving} onClick={next} style={{
          width: "100%", background: canNext() ? "var(--ink)" : "#d8cfbc", color: "#fff",
          border: "none", borderRadius: 32, padding: "17px", fontSize: 17, fontWeight: 800,
          marginTop: 20, cursor: canNext() ? "pointer" : "default",
        }}>
          {saving ? "Saving..." : step === steps.length - 1 ? "Finish &#127881;" : "Continue"}
        </button>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%", padding: "15px 18px", fontSize: 17, fontWeight: 600,
  border: "2.5px solid #e8dfcc", borderRadius: 18, background: "#fff",
  color: "var(--ink)", outline: "none", fontFamily: "inherit",
};
