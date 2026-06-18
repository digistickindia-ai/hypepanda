import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Sends a verification LINK via Brevo's transactional email API.
// Requires env vars: BREVO_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
export async function POST(request) {
  try {
    const { user_id, email, name } = await request.json();
    if (!user_id || !email) return NextResponse.json({ error: "missing user_id/email" }, { status: 400 });

    const brevoKey = process.env.BREVO_API_KEY;
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!brevoKey || !serviceKey) return NextResponse.json({ error: "server not configured" }, { status: 200 });

    // service-role client to write the token (bypasses RLS safely on the server)
    const supabase = createClient(supaUrl, serviceKey);

    // create a token row
    const { data: row, error: insErr } = await supabase
      .from("email_verifications")
      .insert({ user_id, email })
      .select("token")
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 200 });

    const link = `https://www.hypepanda.in/app/verify?token=${row.token}`;
    const first = (name || "there").split(" ")[0];

    const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;background:#FBF3E4;border-radius:16px">
      <div style="text-align:center;font-size:22px;font-weight:800;color:#1c1c1c;margin-bottom:8px">Hype<span style="color:#7B6CD9">panda</span></div>
      <h2 style="color:#1c1c1c">Verify your email, ${first}</h2>
      <p style="color:#6b6357;line-height:1.6">Welcome to HypePanda! Tap the button below to verify your email and unlock everything.</p>
      <a href="${link}" style="display:inline-block;background:#1c1c1c;color:#fff;text-decoration:none;font-weight:800;padding:14px 28px;border-radius:26px;margin:12px 0">Verify my email</a>
      <p style="color:#a89e8e;font-size:13px;line-height:1.5">Or paste this link in your browser:<br>${link}</p>
      <p style="color:#a89e8e;font-size:12px;margin-top:24px">HypePanda · a brand of Digistick Services Pvt. Ltd. · support@hypepanda.in</p>
    </div>`;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoKey, "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        sender: { name: "HypePanda", email: "support@hypepanda.in" },
        to: [{ email, name: first }],
        subject: "Verify your email · HypePanda",
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: "brevo: " + t }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 200 });
  }
}
