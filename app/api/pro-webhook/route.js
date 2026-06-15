import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const PRO_DAYS = 30;

// Cashfree redirects here after payment. We verify the order, and if paid,
// activate a 30-day Pro pass for the creator.
export async function GET(request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order");
  const origin = url.origin;

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  const mode = process.env.CASHFREE_MODE || "sandbox";
  const base = mode === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";

  try {
    const res = await fetch(base + "/pg/orders/" + orderId, {
      headers: { "x-api-version": "2023-08-01", "x-client-id": appId, "x-client-secret": secret },
    });
    const order = await res.json();

    if (order.order_status === "PAID") {
      const { data: pay } = await supabase.from("pro_payments").select("*").eq("cf_order_id", orderId).single();
      if (pay && pay.status !== "paid") {
        const until = new Date(Date.now() + PRO_DAYS * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("pro_payments").update({ status: "paid" }).eq("cf_order_id", orderId);
        await supabase.from("profiles").update({ is_pro: true, pro_until: until }).eq("id", pay.creator_id);
        await supabase.from("notifications").insert({ user_id: pay.creator_id, kind: "payment", text: "You're now HypePanda Pro! Featured placement, lower fees & more are live for 30 days. 🐼✨", link: "/app/profile" });
      }
      return NextResponse.redirect(origin + "/app/pro?status=success");
    }
    return NextResponse.redirect(origin + "/app/pro?status=failed");
  } catch (e) {
    return NextResponse.redirect(origin + "/app/pro?status=error");
  }
}
