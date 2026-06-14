import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Creates a Cashfree payment order for a deal, then returns a payment link.
// The buyer (business) pays; funds are held until the business releases them
// (escrow behaviour). Full vendor-split settlement is configured in your
// Cashfree dashboard once your marketplace account is approved — see SETUP.

export async function POST(request) {
  try {
    const { dealId } = await request.json();

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const { data: deal } = await supabase.from("deals").select("*").eq("id", dealId).single();
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    if (deal.business_id !== user.id) return NextResponse.json({ error: "Only the business can pay" }, { status: 403 });

    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET_KEY;
    const mode = process.env.CASHFREE_MODE || "sandbox"; // sandbox | production
    if (!appId || !secret) {
      return NextResponse.json({ error: "Cashfree keys not set yet. Add them in Vercel env vars." }, { status: 400 });
    }

    const base = mode === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";
    const origin = new URL(request.url).origin;

    const orderId = "deal_" + dealId.slice(0, 8) + "_" + Date.now();

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
        order_amount: deal.amount,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_email: user.email || "buyer@hypepanda.app",
          customer_phone: "9999999999",
        },
        order_meta: {
          return_url: origin + "/api/pay-webhook?deal=" + dealId + "&order=" + orderId,
        },
        order_note: "HypePanda deal: " + deal.title,
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || "Cashfree error" }, { status: 400 });

    await supabase.from("deals").update({ cashfree_order_id: orderId }).eq("id", dealId);

    // Cashfree returns a payment_session_id; build a hosted checkout link.
    const link = (mode === "production" ? "https://payments.cashfree.com" : "https://payments-test.cashfree.com")
      + "/order/#" + data.payment_session_id;

    return NextResponse.json({ payment_link: link, order_id: orderId });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
