"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Logo from "../../../Logo";
import Icon from "../../../Icon";

const CATEGORIES = ["Skincare & Beauty", "Fashion & Apparel", "Food & Beverage", "Health & Wellness", "Tech & Gadgets", "Home & Living", "Jewellery", "Travel & Hospitality", "Other"];
const TEAM = ["Just me", "2-5", "6-20", "20+"];

export default function AgencyOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(-1);
  const [saving, setSaving] = useState(false);

  const [agency, setAgency] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [team, setTeam] = useState("");
  const [verticals, setVerticals] = useState([]);
  // client brands: array of {name, category}
  const [brands, setBrands] = useState([{ name: "", category: "" }]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/app"); return; }
      setUser(data.user);
      setAgency(data.user.user_metadata?.full_name || "");
    });
  }, []);

  const steps = [
    { title: "What's your agency called?", sub: "Your agency's name." },
    { title: "Tell us about your team", sub: "Where you're based and how big you are." },
    { title: "What verticals do you work in?", sub: "Pick the categories your clients are in." },
    { title: "Add your client brands", sub: "You can manage campaigns for each. Add at least one — more anytime." },
  ];

  const toggleVertical = (v) => setVerticals((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  const updateBrand = (i, key, val) => setBrands((prev) => prev.map((b, idx) => idx === i ? { ...b, [key]: val } : b));
  const addBrand = () => setBrands((prev) => [...prev, { name: "", category: "" }]);
  const removeBrand = (i) => setBrands((prev) => prev.filter((_, idx) => idx !== i));

  const canNext = () => {
    if (step === 0) return agency.trim().length > 1;
    if (step === 1) return city.trim().length > 1 && team !== "" && phone.trim().length >= 8;
    if (step === 2) return verticals.length > 0;
    if (step === 3) return brands.some((b) => b.name.trim().length > 1);
    return false;
  };

  const finish = async () => {
    setSaving(true);
    const payload = {
      role: "agency", company_name: agency.trim(), full_name: agency.trim(),
      city: city.trim(), team_size: team, verticals: verticals.join(","),
      email: user.email, phone: phone.trim(), onboarding_done: true,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    if (error) { setSaving(false); alert("Couldn't save: " + error.message); return; }

    const valid = brands.filter((b) => b.name.trim().length > 1).map((b) => ({
      agency_id: user.id, name: b.name.trim(), category: b.category || null,
    }));
    if (valid.length) {
      const { error: e2 } = await supabase.from("brands").insert(valid);
      if (e2) { setSaving(false); alert("Saved agency, but couldn't add brands: " + e2.message + "\n\nRun business-agency-patch.sql in Supabase."); return; }
    }
    setSaving(false);
    router.replace("/app/home?role=agency");
  };

  const next = () => { if (step < steps.length - 1) setStep(step + 1); else finish(); };
  const s = steps[step];

  if (step === -1) {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", padding: "28px 24px 36px" }}>
          <div style={{ marginBottom: 28 }}><Logo height={34} /></div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#BA7517", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>For agencies</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", lineHeight: 1.15, margin: "0 0 14px" }}>All your clients.<br />One command center.</h1>
            <p style={{ fontSize: 16, color: "var(--muted)", fontWeight: 600, lineHeight: 1.55, margin: "0 0 28px" }}>Run influencer campaigns for every client brand in one place. Discover verified creators for shoots and UGC, manage each brand, and pay securely — all from your agency HQ.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <WelcomePoint icon="rocket" color="var(--yellow)" iconColor="#412402" title="Manage every brand" text="Add all your client brands and run campaigns for each." />
              <WelcomePoint icon="check" color="var(--green)" title="Verified creators" text="Real, checked creators for shoots, UGC, and collabs." />
              <WelcomePoint icon="wallet" color="var(--coral)" title="Secure payments" text="Funds held safely and released only on approval." />
            </div>
          </div>
          <button onClick={() => setStep(0)} className="pressable" style={{ background: "var(--ink)", color: "#fff", border: "none", borderRadius: 28, padding: "17px", fontSize: 17, fontWeight: 800, marginTop: 28 }}>Set up your agency</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 460, padding: "28px 24px 40px", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 20 }}><Logo height={34} /></div>

        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {steps.map((_, i) => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? "var(--yellow)" : "#e8dfcc" }} />)}
        </div>

        <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--ink)", margin: "0 0 6px" }}>{s.title}</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, margin: "0 0 22px" }}>{s.sub}</p>

        <div style={{ flex: 1 }}>
          {step === 0 && <input autoFocus value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="e.g. Digistick Services" style={inp} />}

          {step === 1 && (
            <div>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (e.g. Noida)" style={inp} />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" style={{ ...inp, marginTop: 12 }} />
              <label style={{ ...lbl, marginTop: 18 }}>Team size</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TEAM.map((t) => <button key={t} onClick={() => setTeam(t)} style={pill(team === t, "var(--yellow)", "#412402")}>{t}</button>)}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => <button key={c} onClick={() => toggleVertical(c)} style={pill(verticals.includes(c), "var(--yellow)", "#412402")}>{c}</button>)}
            </div>
          )}

          {step === 3 && (
            <div>
              {brands.map((b, i) => (
                <div key={i} style={{ background: "#fff", border: "1.5px solid #efe7d6", borderRadius: 16, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>Brand {i + 1}</span>
                    {brands.length > 1 && <button onClick={() => removeBrand(i)} style={{ fontSize: 12, fontWeight: 800, color: "#A32D2D" }}>Remove</button>}
                  </div>
                  <input value={b.name} onChange={(e) => updateBrand(i, "name", e.target.value)} placeholder="Brand name" style={inp} />
                  <select value={b.category} onChange={(e) => updateBrand(i, "category", e.target.value)} style={{ ...inp, marginTop: 10 }}>
                    <option value="">Category (optional)</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
              <button onClick={addBrand} style={{ width: "100%", background: "#fff", border: "2px dashed #d8c98c", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 800, color: "#854F0B", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="rocket" size={16} color="#854F0B" /> Add another brand
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {step > 0 && <button onClick={() => setStep(step - 1)} style={{ background: "#fff", border: "2px solid #e8dfcc", borderRadius: 26, padding: "15px 22px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>Back</button>}
          <button onClick={next} disabled={!canNext() || saving} style={{ flex: 1, background: canNext() ? "var(--ink)" : "#d8d0c0", color: "#fff", border: "none", borderRadius: 26, padding: "15px", fontSize: 16, fontWeight: 800 }}>
            {saving ? "Setting up…" : step === steps.length - 1 ? "Open agency HQ" : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}

const inp = { width: "100%", padding: "15px 18px", fontSize: 15, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 16, background: "#fff", color: "var(--ink)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const lbl = { display: "block", fontSize: 13, fontWeight: 800, color: "var(--muted)", marginBottom: 8 };
function pill(active, color, textOnActive = "#fff") {
  return { padding: "11px 16px", borderRadius: 20, fontSize: 14, fontWeight: 700, border: active ? `2px solid ${color}` : "2px solid #e8dfcc", background: active ? color : "#fff", color: active ? textOnActive : "var(--ink)", cursor: "pointer" };
}

function WelcomePoint({ icon, color, iconColor = "#fff", title, text }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={20} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, lineHeight: 1.4 }}>{text}</div>
      </div>
    </div>
  );
}
