"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { NICHES } from "@/lib/me";
import Logo from "../../../Logo";

const CATEGORIES = ["Skincare & Beauty", "Fashion & Apparel", "Food & Beverage", "Health & Wellness", "Tech & Gadgets", "Home & Living", "Jewellery", "Travel & Hospitality", "Other"];
const AGE_BANDS = ["13-17", "18-24", "25-34", "35-44", "45+"];
const GENDERS = [["all", "Everyone"], ["women", "Mostly women"], ["men", "Mostly men"]];

export default function BusinessOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [website, setWebsite] = useState("");
  const [igHandle, setIgHandle] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("all");
  const [audienceCities, setAudienceCities] = useState("");
  const [targetNiches, setTargetNiches] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/app"); return; }
      setUser(data.user);
      setBrand(data.user.user_metadata?.full_name || "");
    });
  }, []);

  const steps = [
    { title: "What's your brand called?", sub: "The name creators will see." },
    { title: "What do you sell?", sub: "Pick the closest category." },
    { title: "Where can creators find you?", sub: "Your website, Instagram and phone — phone is required." },
    { title: "Who's your audience?", sub: "This helps us match the right creators." },
    { title: "What creators do you want?", sub: "Pick the niches that fit your brand." },
  ];

  const canNext = () => {
    if (step === 0) return brand.trim().length > 1;
    if (step === 1) return category !== "";
    if (step === 2) return phone.trim().length >= 8;
    if (step === 3) return age !== "";
    if (step === 4) return targetNiches.length > 0;
    return false;
  };

  const toggleNiche = (n) => setTargetNiches((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const finish = async () => {
    setSaving(true);
    const payload = {
      role: "business", company_name: brand.trim(), full_name: brand.trim(),
      category, website: website.trim(), instagram_handle_biz: igHandle.replace("@", "").trim(),
      city: city.trim(), audience_age: age, audience_gender: gender,
      audience_cities: audienceCities.trim(), target_niches: targetNiches.join(","),
      email: user.email, phone: phone.trim(), onboarding_done: true,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setSaving(false);
    if (error) { alert("Couldn't save: " + error.message); return; }
    router.replace("/app/home?role=business");
  };

  const next = () => { if (step < steps.length - 1) setStep(step + 1); else finish(); };
  const s = steps[step];

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "28px 24px 40px", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 20 }}><Logo height={34} /></div>

        {/* progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? "var(--blue)" : "#e8dfcc" }} />
          ))}
        </div>

        <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--ink)", margin: "0 0 6px" }}>{s.title}</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, margin: "0 0 22px" }}>{s.sub}</p>

        <div style={{ flex: 1 }}>
          {step === 0 && <input autoFocus value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Glow Cosmetics" style={inp} />}

          {step === 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)} style={pill(category === c, "var(--blue)")}>{c}</button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbrand.com" style={inp} />
              <div style={{ position: "relative", marginTop: 12 }}>
                <span style={{ position: "absolute", left: 16, top: 15, fontSize: 16, fontWeight: 700, color: "var(--faint)" }}>@</span>
                <input value={igHandle} onChange={(e) => setIgHandle(e.target.value)} placeholder="yourbrand" style={{ ...inp, paddingLeft: 34 }} />
              </div>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (e.g. Noida)" style={{ ...inp, marginTop: 12 }} />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" style={{ ...inp, marginTop: 12 }} />
            </div>
          )}

          {step === 3 && (
            <div>
              <label style={lbl}>Audience age</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {AGE_BANDS.map((a) => <button key={a} onClick={() => setAge(a)} style={pill(age === a, "var(--blue)")}>{a}</button>)}
              </div>
              <label style={lbl}>Audience gender</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {GENDERS.map(([v, l]) => <button key={v} onClick={() => setGender(v)} style={pill(gender === v, "var(--blue)")}>{l}</button>)}
              </div>
              <label style={lbl}>Main cities (optional)</label>
              <input value={audienceCities} onChange={(e) => setAudienceCities(e.target.value)} placeholder="e.g. Delhi, Mumbai, Bangalore" style={inp} />
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {NICHES.map((n) => <button key={n} onClick={() => toggleNiche(n)} style={pill(targetNiches.includes(n), "var(--blue)")}>{n}</button>)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {step > 0 && <button onClick={() => setStep(step - 1)} style={{ background: "#fff", border: "2px solid #e8dfcc", borderRadius: 26, padding: "15px 22px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>Back</button>}
          <button onClick={next} disabled={!canNext() || saving} style={{ flex: 1, background: canNext() ? "var(--ink)" : "#d8d0c0", color: "#fff", border: "none", borderRadius: 26, padding: "15px", fontSize: 16, fontWeight: 800 }}>
            {saving ? "Setting up…" : step === steps.length - 1 ? "Start finding creators" : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}

const inp = { width: "100%", padding: "15px 18px", fontSize: 15, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 16, background: "#fff", color: "var(--ink)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const lbl = { display: "block", fontSize: 13, fontWeight: 800, color: "var(--muted)", marginBottom: 8 };
function pill(active, color) {
  return { padding: "11px 16px", borderRadius: 20, fontSize: 14, fontWeight: 700, border: active ? `2px solid ${color}` : "2px solid #e8dfcc", background: active ? color : "#fff", color: active ? "#fff" : "var(--ink)", cursor: "pointer" };
}
