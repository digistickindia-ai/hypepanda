import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Sends a password-reset LINK via Resend.
// Requires env vars: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "missing email" }, { status: 400 });

    const resendKey = process.env.RESEND_API_KEY;
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!resendKey || !serviceKey) return NextResponse.json({ error: "server not configured" }, { status: 200 });

    const supabase = createClient(supaUrl, serviceKey);

    // find the user by email (don't reveal whether they exist — always return ok)
    const { data: prof } = await supabase.from("profiles").select("id, full_name").eq("email", email).maybeSingle();
    if (!prof) return NextResponse.json({ ok: true }); // silent: don't leak which emails exist

    const { data: row, error: insErr } = await supabase
      .from("password_resets")
      .insert({ user_id: prof.id, email })
      .select("token")
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 200 });

    const link = `https://www.hypepanda.in/app/reset?token=${row.token}`;
    const first = (prof.full_name || "there").split(" ")[0];

    const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;background:#FBF3E4;border-radius:16px">
      <div style="text-align:center;font-size:22px;font-weight:800;color:#1c1c1c;margin-bottom:8px">Hype<span style="color:#7B6CD9">panda</span></div>
      <h2 style="color:#1c1c1c">Reset your password, ${first}</h2>
      <p style="color:#6b6357;line-height:1.6">We got a request to reset your HypePanda password. Tap below to choose a new one. This link expires in 1 hour.</p>
      <a href="${link}" style="display:inline-block;background:#1c1c1c;color:#fff;text-decoration:none;font-weight:800;padding:14px 28px;border-radius:26px;margin:12px 0">Reset my password</a>
      <p style="color:#a89e8e;font-size:13px;line-height:1.5">If you didn't ask for this, you can ignore this email. Or paste this link:<br>${link}</p>
      <p style="color:#a89e8e;font-size:12px;margin-top:24px">HypePanda · a brand of Digistick Services Pvt. Ltd. · support@hypepanda.in</p>
    </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + resendKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "HypePanda <support@hypepanda.in>",
        to: [email],
        subject: "Reset your password · HypePanda",
        html,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: "resend: " + t }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 200 });
  }
}
