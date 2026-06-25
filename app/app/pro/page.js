"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadMe, inr, isProActive, PRO_PRICE, PRO_COMMISSION, DEFAULT_COMMISSION, PRO_REELS } from "@/lib/me";
import Panda from "../../Panda";
import Icon from "../../Icon";

const PERKS = [
  { icon: "star", title: "Featured placement", desc: "Show up first in brand search and at the top of Reels." },
  { icon: "panda", title: "Pro badge", desc: "A verified-style Pro badge on your profile and cards." },
  { icon: "rupee", title: "Half commission", desc: `Pay just ${PRO_COMMISSION}% per deal instead of ${DEFAULT_COMMISSION}%. Pays for itself fast.` },
  { icon: "chart", title: "Profile analytics", desc: "See how many brands viewed your profile." },
  { icon: "film", title: "More reels", desc: `Upload up to ${PRO_REELS} showcase reels instead of 3.` },
  { icon: "rocket", title: "Priority ranking", desc: "Rank above free creators in every list." },
];

function ProInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    const status = params.get("status");
    if (status === "success") setBanner("Welcome to Pro! Your perks are now live.");
    if (status === "failed") setBanner("Payment didn't go through. You can try again.");
    if (status === "error") setBanner("Something went wrong verifying payment. If money was deducted, it'll reflect shortly.");
    (async () => {
      const res = await loadMe(router);
      if (!res) return;
      if (res.profile.role !== "creator") { router.replace("/app/home"); return; }
      setMe(res);
      setLoading(false);
      // Preload the Paytm checkout script as soon as we know the merchant id,
      // so tapping "Go Pro" launches instantly instead of waiting on a fresh load.
      try {
        const pr = await fetch("/api/pro-config");
        const pj = await pr.json();
        if (pj.mid) {
          const host = pj.mode === "production" ? "https://secure.paytmpayments.com" : "https://securegw-stage.paytm.in";
          if (!document.getElementById("paytm-checkout-js")) {
            const s = document.createElement("script");
            s.id = "paytm-checkout-js";
            s.src = `${host}/merchantpgpui/checkoutjs/merchants/${pj.mid}.js`;
            s.async = true;
            document.body.appendChild(s);
          }
        }
      } catch (e) {}
    })();
  }, []);

  const upgrade = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/pro-pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await r.json();
      if (j.paytmRaw) console.log("Paytm raw response:", j.paytmRaw);
      if (!j.txnToken) { alert(j.error || "Couldn't start payment. Make sure Paytm keys are set."); setBusy(false); return; }

      const host = j.mode === "production" ? "https://secure.paytmpayments.com" : "https://securegw-stage.paytm.in";

      const invoke = () => {
        const config = {
          root: "",
          flow: "DEFAULT",
          data: { orderId: j.orderId, token: j.txnToken, tokenType: "TXN_TOKEN", amount: String(j.amount) },
          handler: { notifyMerchant: (eventName) => { if (eventName === "APP_CLOSED") setBusy(false); } },
        };
        window.Paytm.CheckoutJS.init(config)
          .then(() => { window.Paytm.CheckoutJS.invoke(); setBusy(false); })
          .catch((err) => { console.error("Paytm init error:", err); alert("Couldn't open Paytm checkout. Please try again."); setBusy(false); });
      };

      // Make sure the script is present (it's usually preloaded on page open)
      if (!document.getElementById("paytm-checkout-js")) {
        const s = document.createElement("script");
        s.id = "paytm-checkout-js";
        s.src = `${host}/merchantpgpui/checkoutjs/merchants/${j.mid}.js`;
        s.async = true;
        document.body.appendChild(s);
      }

      // Poll for the SDK to be ready, up to ~12s, then give a clear error
      // instead of hanging on "Starting..." forever.
      let waited = 0;
      const iv = setInterval(() => {
        if (window.Paytm && window.Paytm.CheckoutJS) {
          clearInterval(iv);
          invoke();
        } else if ((waited += 300) >= 12000) {
          clearInterval(iv);
          alert("Paytm is taking too long to load. Please check your connection and try again.");
          setBusy(false);
        }
      }, 300);
    } catch (e) { alert("Payment error: " + e.message); setBusy(false); }
  };

  if (loading) return <main style={{ minHeight: "100dvh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}><Panda size={80} /></main>;

  const pro = isProActive(me.profile);

  return (
    <main style={{ minHeight: "100dvh", background: "var(--cream)" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 40px" }}>
        <button onClick={() => router.back()} style={{ fontSize: 20, color: "var(--ink)", marginBottom: 8 }}>←</button>

        {banner && <div style={{ background: pro ? "var(--green)" : "#FAEEDA", color: pro ? "#173404" : "#854F0B", borderRadius: 14, padding: "12px 16px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{banner}</div>}

        <div style={{ textAlign: "center", marginBottom: 8 }}><Panda size={84} style={{ margin: "0 auto" }} /></div>

        {pro ? (
          <>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1px", color: "var(--ink)", textAlign: "center", margin: "4px 0 4px" }}>You're Pro</h1>
            <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, textAlign: "center", marginBottom: 8 }}>
              Active until {new Date(me.profile.pro_until).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1.5px", color: "var(--ink)", textAlign: "center", margin: "4px 0 4px" }}>Go Pro</h1>
            <p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600, textAlign: "center", marginBottom: 20 }}>Get hired more. Stand out, pay less commission.</p>
          </>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {PERKS.map((p) => (
            <div key={p.title} style={{ display: "flex", gap: 14, background: "#fff", borderRadius: 16, padding: 14, border: "1.5px solid #efe7d6", alignItems: "center" }}>
              <div style={{ flexShrink: 0, width: 30, display: "flex", justifyContent: "center" }}>{p.icon === "panda" ? <Panda size={26} animate={false} /> : <Icon name={p.icon} size={24} color="var(--coral)" />}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{p.title}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {!pro && (
          <>
            <button onClick={upgrade} disabled={busy} className="pressable" style={{ width: "100%", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 30, padding: "17px", fontSize: 17, fontWeight: 800 }}>
              {busy ? "Starting…" : `Go Pro — ${inr(PRO_PRICE)}/month`}
            </button>
            <p style={{ fontSize: 12, color: "var(--faint)", textAlign: "center", marginTop: 10, fontWeight: 600 }}>30-day access. One-time payment, no auto-renewal yet.</p>
          </>
        )}
      </div>
    </main>
  );
}

export default function ProPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100dvh", background: "var(--cream)" }} />}>
      <ProInner />
    </Suspense>
  );
}
