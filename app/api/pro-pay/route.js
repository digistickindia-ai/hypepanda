import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { paytmChecksum, paytmBase } from "@/lib/paytm";

const PRO_PRICE = 499;

// Creates a Paytm transaction token for a 30-day Pro pass.
export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "creator") {
      return NextResponse.json({ error: "Only creators can buy Pro" }, { status: 403 });
    }

    const mid = (process.env.PAYTM_MID || "").trim();
    const key = (process.env.PAYTM_MERCHANT_KEY || "").trim();
    const mode = (process.env.PAYTM_MODE || "production").trim();
    if (!mid || !key) {
      return NextResponse.json({ error: "Paytm keys not set yet. Add PAYTM_MID and PAYTM_MERCHANT_KEY in Vercel env vars." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const orderId = "pro_" + user.id.slice(0, 8) + "_" + Date.now();
    // Paytm custId should be alphanumeric and reasonably short; a raw UUID with
    // hyphens can be rejected. Strip hyphens and cap length.
    const custId = ("c" + user.id.replace(/-/g, "")).slice(0, 30);

    await supabase.from("pro_payments").insert({ creator_id: user.id, amount: PRO_PRICE, cf_order_id: orderId, status: "created" });

    const callbackUrl = origin + "/api/pro-webhook?order=" + orderId;

    const body = {
      requestType: "Payment",
      mid,
      websiteName: mode === "production" ? "DEFAULT" : "WEBSTAGING",
      orderId,
      callbackUrl,
      txnAmount: { value: String(PRO_PRICE), currency: "INR" },
      userInfo: { custId },
    };

    const bodyStr = JSON.stringify(body);
    let signature;
    try {
      signature = await paytmChecksum(bodyStr, key);
    } catch (e) {
      if (String(e).includes("Invalid key length")) {
        return NextResponse.json({ error: `Paytm Merchant Key looks wrong (length ${key.length}). It should be your exact Merchant Key from the Paytm dashboard — re-copy it with no extra spaces.` }, { status: 400 });
      }
      throw e;
    }
    const base = paytmBase(mode);

    // Build the payload by concatenation so the EXACT signed bodyStr is sent
    // (re-serializing via JSON.stringify({body,...}) can change bytes and break checksum 501).
    const payload = `{"body":${bodyStr},"head":{"signature":"${signature}"}}`;

    const res = await fetch(`${base}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    const data = await res.json();

    const txnToken = data?.body?.txnToken;
    if (!txnToken) {
      const ri = data?.body?.resultInfo || {};
      const detail = [ri.resultMsg, ri.resultCode ? "code " + ri.resultCode : null, ri.resultStatus]
        .filter(Boolean).join(" · ");
      // include the raw response too, so nothing is hidden while debugging
      return NextResponse.json({
        error: "Paytm: " + (detail || "could not start payment"),
        paytmRaw: data,
      }, { status: 400 });
    }

    return NextResponse.json({ txnToken, orderId, mid, amount: PRO_PRICE, mode, callbackUrl });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
