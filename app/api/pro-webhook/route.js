import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { paytmChecksum, paytmBase } from "@/lib/paytm";

const PRO_DAYS = 30;

// Paytm redirects here (POST) after payment. We verify the transaction
// status server-to-server, and if successful, activate a 30-day Pro pass.
async function handle(request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order");
  const origin = url.origin;

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mid = process.env.PAYTM_MID;
  const key = process.env.PAYTM_MERCHANT_KEY;
  const mode = process.env.PAYTM_MODE || "production";

  const supabase = createClient(supaUrl, serviceKey);

  try {
    // Verify via Paytm's transaction status API (don't trust the redirect alone)
    const body = { mid, orderId };
    const bodyStr = JSON.stringify(body);
    const signature = await paytmChecksum(bodyStr, key);
    const base = paytmBase(mode);

    const res = await fetch(`${base}/v3/order/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, head: { signature } }),
    });
    const data = await res.json();
    const status = data?.body?.resultInfo?.resultStatus;

    if (status === "TXN_SUCCESS") {
      const { data: pay } = await supabase.from("pro_payments").select("*").eq("cf_order_id", orderId).single();
      if (pay && pay.status !== "paid") {
        const until = new Date(Date.now() + PRO_DAYS * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("pro_payments").update({ status: "paid" }).eq("cf_order_id", orderId);
        await supabase.from("profiles").update({ is_pro: true, pro_until: until }).eq("id", pay.creator_id);
        await supabase.from("notifications").insert({ user_id: pay.creator_id, kind: "payment", text: "You're now HypePanda Pro! Featured placement, lower fees & more are live for 30 days.", link: "/app/profile" });
      }
      return NextResponse.redirect(origin + "/app/pro?status=success", 303);
    }
    return NextResponse.redirect(origin + "/app/pro?status=failed", 303);
  } catch (e) {
    return NextResponse.redirect(origin + "/app/pro?status=error", 303);
  }
}

export async function POST(request) { return handle(request); }
export async function GET(request) { return handle(request); }
