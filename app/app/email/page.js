"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Logo from "../../Logo";

function EmailAuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") || "creator";
  const supabase = createClient();

  // mode: "signup" | "login" | "verify" | "forgot" | "reset"
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const go = (m) => { setMode(m); setErr(""); setMsg(""); };

  // ---- RESEND the code ----
  const resend = async () => {
    if (cooldown > 0) return;
    setErr(""); setMsg("");
    setBusy(true);
    // For signup verification and reset, re-send an email OTP code.
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: mode === "verify" } });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setMsg("New code sent. Check your inbox.");
    setCooldown(30);
    const timer = setInterval(() => {
      setCooldown((c) => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
    }, 1000);
  };

  // ---- SIGN UP (password) then OTP verify ----
  const signUp = async () => {
    setErr(""); setMsg("");
    if (!email || !password) { setErr("Enter email and password."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: undefined },
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setMsg("We sent a 6-digit code to your email. Enter it below to verify.");
    setMode("verify");
  };

  // ---- VERIFY OTP (after signup) ----
  const verifyOtp = async () => {
    setErr(""); setMsg("");
    if (!otp) { setErr("Enter the code from your email."); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.replace("/app/home?role=" + role);
  };

  // ---- LOGIN (password) ----
  const login = async () => {
    setErr(""); setMsg("");
    if (!email || !password) { setErr("Enter email and password."); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.replace("/app/home?role=" + role);
  };

  // ---- FORGOT: send OTP code to reset ----
  const sendResetOtp = async () => {
    setErr(""); setMsg("");
    if (!email) { setErr("Enter your email first."); return; }
    setBusy(true);
    // signInWithOtp sends a 6-digit code (email OTP) the user can use to get in
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setMsg("We sent a 6-digit code to your email.");
    setMode("reset");
  };

  // ---- RESET: verify the OTP, then set a new password ----
  const verifyResetOtp = async () => {
    setErr(""); setMsg("");
    if (!otp) { setErr("Enter the code from your email."); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error) { setBusy(false); setErr(error.message); return; }
    if (password) {
      const { error: e2 } = await supabase.auth.updateUser({ password });
      if (e2) { setBusy(false); setErr(e2.message); return; }
    }
    setBusy(false);
    router.replace("/app/home?role=" + role);
  };

  const titleMap = {
    login: "Welcome back", signup: "Create your account",
    verify: "Verify your email", forgot: "Reset password", reset: "Enter code & new password",
  };

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "32px 24px 40px", display: "flex", flexDirection: "column" }}>
        <div onClick={() => router.push("/app?role=" + role)} style={{ cursor: "pointer", marginBottom: 24 }}>
          <Logo height={40} />
        </div>

        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--ink)", margin: "0 0 6px" }}>{titleMap[mode]}</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, margin: "0 0 22px" }}>
          {mode === "login" && "Log in with your email and password."}
          {mode === "signup" && "Sign up with email — we'll send a code to verify."}
          {mode === "verify" && "Check your inbox for a 6-digit code."}
          {mode === "forgot" && "We'll email you a code to reset your password."}
          {mode === "reset" && "Enter the code and choose a new password."}
        </p>

        {msg && <div style={{ background: "var(--green)", color: "#173404", borderRadius: 14, padding: "12px 16px", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{msg}</div>}
        {err && <div style={{ background: "#FBE3E0", color: "#A32D2D", borderRadius: 14, padding: "12px 16px", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{err}</div>}

        {/* EMAIL field — shown in all modes except pure verify */}
        {(mode === "login" || mode === "signup" || mode === "forgot") && (
          <Field type="email" placeholder="you@email.com" value={email} onChange={setEmail} />
        )}

        {/* PASSWORD field */}
        {(mode === "login" || mode === "signup") && (
          <Field type="password" placeholder="Password" value={password} onChange={setPassword} />
        )}

        {/* OTP code field */}
        {(mode === "verify" || mode === "reset") && (
          <Field type="text" placeholder="6-digit code" value={otp} onChange={setOtp} inputMode="numeric" />
        )}

        {/* New password on reset */}
        {mode === "reset" && (
          <Field type="password" placeholder="New password" value={password} onChange={setPassword} />
        )}

        {/* primary action */}
        <button className="pressable" disabled={busy} onClick={() => {
          if (mode === "login") login();
          else if (mode === "signup") signUp();
          else if (mode === "verify") verifyOtp();
          else if (mode === "forgot") sendResetOtp();
          else if (mode === "reset") verifyResetOtp();
        }} style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 28, padding: "16px", fontSize: 16, fontWeight: 800, marginTop: 6 }}>
          {busy ? "Please wait…" :
            mode === "login" ? "Log in" :
            mode === "signup" ? "Sign up" :
            mode === "verify" ? "Verify & continue" :
            mode === "forgot" ? "Send code" : "Reset & continue"}
        </button>

        {/* resend code (verify + reset modes) */}
        {(mode === "verify" || mode === "reset") && (
          <button onClick={resend} disabled={busy || cooldown > 0} style={{ width: "100%", background: "transparent", border: "none", color: cooldown > 0 ? "var(--faint)" : "var(--coral)", fontSize: 14, fontWeight: 800, marginTop: 14, cursor: cooldown > 0 ? "default" : "pointer" }}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        )}

        {/* switching links */}
        <div style={{ marginTop: 18, fontSize: 14, color: "var(--muted)", fontWeight: 600, textAlign: "center", lineHeight: 2 }}>
          {mode === "login" && (<>
            <div>New here? <a onClick={() => go("signup")} style={link}>Create an account</a></div>
            <div><a onClick={() => go("forgot")} style={link}>Forgot password?</a></div>
          </>)}
          {mode === "signup" && <div>Already have an account? <a onClick={() => go("login")} style={link}>Log in</a></div>}
          {(mode === "verify" || mode === "forgot" || mode === "reset") && <div><a onClick={() => go("login")} style={link}>← Back to login</a></div>}
        </div>

        <p style={{ fontSize: 12, color: "var(--faint)", marginTop: 24, textAlign: "center", lineHeight: 1.5 }}>
          By continuing you agree to our <a href="/legal/terms" style={{ color: "var(--muted)", fontWeight: 600 }}>Terms</a> & <a href="/legal/privacy" style={{ color: "var(--muted)", fontWeight: 600 }}>Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}

const link = { color: "var(--coral)", fontWeight: 800, cursor: "pointer" };

function Field({ type, placeholder, value, onChange, inputMode }) {
  return (
    <input
      type={type} placeholder={placeholder} value={value} inputMode={inputMode}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: "15px 18px", fontSize: 15, fontWeight: 600, border: "2px solid #e8dfcc", borderRadius: 16, background: "#fff", color: "var(--ink)", outline: "none", fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" }}
    />
  );
}

export default function EmailAuth() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100dvh", background: "var(--cream)" }} />}>
      <EmailAuthInner />
    </Suspense>
  );
}
