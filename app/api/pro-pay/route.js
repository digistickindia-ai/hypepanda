import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const PRO_PRICE = 499;

// Creates a Cashfree one-time order for a 30-day Pro pass.
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

    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET_KEY;
    const mode = process.env.CASHFREE_MODE || "sandbox";
    if (!appId || !secret) {
      return NextResponse.json({ error: "Cashfree keys not set yet. Add them in Vercel env vars." }, { status: 400 });
    }

    const base = mode === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";
    const origin = new URL(request.url).origin;
    const orderId = "pro_" + user.id.slice(0, 8) + "_" + Date.now();

    await supabase.from("pro_payments").insert({ creator_id: user.id, amount: PRO_PRICE, cf_order_id: orderId, status: "created" });

    const res = await fetch(base + "/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secret,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: PRO_PRICE,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_email: user.email || "creator@hypepanda.app",
          customer_phone: "9999999999",
        },
        order_meta: {
          return_url: origin + "/api/pro-webhook?order=" + orderId,
        },
        order_note: "HypePanda Pro — 30 day pass",
      }),
    });

    const data = await res.json();
    if (!data.payment_session_id) {
      return NextResponse.json({ error: data.message || "Could not create order" }, { status: 400 });
    }
    return NextResponse.json({ paymentSessionId: data.payment_session_id, orderId, mode });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
