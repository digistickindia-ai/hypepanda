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

    const mid = process.env.PAYTM_MID;
    const key = process.env.PAYTM_MERCHANT_KEY;
    const mode = process.env.PAYTM_MODE || "production";
    if (!mid || !key) {
      return NextResponse.json({ error: "Paytm keys not set yet. Add PAYTM_MID and PAYTM_MERCHANT_KEY in Vercel env vars." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const orderId = "pro_" + user.id.slice(0, 8) + "_" + Date.now();

    await supabase.from("pro_payments").insert({ creator_id: user.id, amount: PRO_PRICE, cf_order_id: orderId, status: "created" });

    const callbackUrl = origin + "/api/pro-webhook?order=" + orderId;

    const body = {
      requestType: "Payment",
      mid,
      websiteName: mode === "production" ? "DEFAULT" : "WEBSTAGING",
      orderId,
      callbackUrl,
      txnAmount: { value: String(PRO_PRICE), currency: "INR" },
      userInfo: { custId: user.id },
    };

    const signature = await paytmChecksum(JSON.stringify(body), key);
    const base = paytmBase(mode);

    const res = await fetch(`${base}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, head: { signature } }),
    });
    const data = await res.json();

    const txnToken = data?.body?.txnToken;
    if (!txnToken) {
      return NextResponse.json({ error: "Paytm: " + (data?.body?.resultInfo?.resultMsg || "could not start payment") }, { status: 400 });
    }

    return NextResponse.json({ txnToken, orderId, mid, amount: PRO_PRICE, mode, callbackUrl });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
