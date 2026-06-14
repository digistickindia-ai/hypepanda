import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// After payment, Cashfree redirects the buyer back here. We verify the order
// status and, if paid, mark the deal as funded (in escrow).

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const dealId = searchParams.get("deal");
  const orderId = searchParams.get("order");

  try {
    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET_KEY;
    const mode = process.env.CASHFREE_MODE || "sandbox";
    const base = mode === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";

    if (appId && secret && orderId) {
      const res = await fetch(base + "/pg/orders/" + orderId, {
        headers: { "x-api-version": "2023-08-01", "x-client-id": appId, "x-client-secret": secret },
      });
      const data = await res.json();
      if (data.order_status === "PAID") {
        const cookieStore = cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
        );
        await supabase.from("deals").update({ payment_status: "secured", status: "in_progress" }).eq("id", dealId);
        const { data: deal } = await supabase.from("deals").select("creator_id, title").eq("id", dealId).single();
        if (deal) await supabase.from("notifications").insert({ user_id: deal.creator_id, kind: "payment", text: `Payment for "${deal.title}" is secured — start creating!`, link: "/app/chat/" + dealId });
      }
    }
  } catch (e) { /* fall through to redirect */ }

  return NextResponse.redirect(origin + "/app/chat/" + dealId);
}
