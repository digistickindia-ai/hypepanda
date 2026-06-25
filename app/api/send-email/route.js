import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Generic transactional email via Resend, used for all coordination events.
// Requires: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
// Body: { to_user_id?, to_email?, subject, heading, message, ctaText?, ctaLink? }
export async function POST(request) {
  try {
    const { to_user_id, to_email, subject, heading, message, ctaText, ctaLink } = await request.json();

    const resendKey = process.env.RESEND_API_KEY;
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!resendKey || !serviceKey) return NextResponse.json({ error: "server not configured" }, { status: 200 });

    let email = to_email;
    let name = "there";
    if (!email && to_user_id) {
      const supabase = createClient(supaUrl, serviceKey);
      const { data: p } = await supabase.from("profiles").select("email, full_name, company_name").eq("id", to_user_id).maybeSingle();
      if (!p || !p.email) return NextResponse.json({ error: "no email for user" }, { status: 200 });
      email = p.email;
      name = (p.company_name || p.full_name || "there").split(" ")[0];
    }
    if (!email) return NextResponse.json({ error: "no recipient" }, { status: 200 });

    const cta = ctaText && ctaLink
      ? `<a href="${ctaLink}" style="display:inline-block;background:#1c1c1c;color:#fff;text-decoration:none;font-weight:800;padding:14px 28px;border-radius:26px;margin:12px 0">${ctaText}</a>`
      : "";

    const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;background:#FBF3E4;border-radius:16px">
      <div style="text-align:center;font-size:22px;font-weight:800;color:#1c1c1c;margin-bottom:8px">Hype<span style="color:#7B6CD9">panda</span></div>
      <h2 style="color:#1c1c1c">${heading}</h2>
      <p style="color:#6b6357;line-height:1.6">${message}</p>
      ${cta}
      <p style="color:#a89e8e;font-size:12px;margin-top:24px">HypePanda · a brand of Digistick Services Pvt. Ltd. · support@hypepanda.in</p>
    </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + resendKey, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "HypePanda <support@hypepanda.in>", to: [email], subject, html }),
    });
    if (!res.ok) { const t = await res.text(); return NextResponse.json({ error: "resend: " + t }, { status: 200 }); }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 200 });
  }
}
