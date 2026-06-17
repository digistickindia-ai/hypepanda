import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { email, name } = await request.json();
    if (!email) return NextResponse.json({ error: "no email" }, { status: 400 });

    // Uses the same Workspace/Gmail SMTP creds you set in env.
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;     // e.g. support@hypepanda.in
    const pass = process.env.SMTP_PASS;     // 16-char app password
    if (!user || !pass) return NextResponse.json({ error: "smtp not configured" }, { status: 200 });

    const transporter = nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } });

    const first = (name || "there").split(" ")[0];
    const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;background:#FBF3E4;border-radius:16px">
      <div style="text-align:center;font-size:22px;font-weight:800;color:#1c1c1c;margin-bottom:8px">Hype<span style="color:#7B6CD9">panda</span></div>
      <h2 style="color:#1c1c1c">You're verified, ${first}!</h2>
      <p style="color:#6b6357;line-height:1.6">Your HypePanda creator account has been verified and is now live. Brands can now discover you, see your verified badge, and send you collaboration offers.</p>
      <a href="https://hypepanda.in/app/home" style="display:inline-block;background:#1c1c1c;color:#fff;text-decoration:none;font-weight:800;padding:13px 26px;border-radius:24px;margin-top:8px">Open HypePanda</a>
      <p style="color:#a89e8e;font-size:12px;margin-top:24px">HypePanda · a brand of Digistick Services Pvt. Ltd. · support@hypepanda.in</p>
    </div>`;

    await transporter.sendMail({
      from: `HypePanda <${user}>`,
      to: email,
      subject: "You're verified on HypePanda ✓",
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 200 });
  }
}
