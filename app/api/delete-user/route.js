import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// HARD DELETE a user: all their data across tables + their auth login account.
// Admin-only: the caller must pass their own access token; we verify is_admin.
// Body: { target_user_id }
export async function POST(request) {
  try {
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "server not configured" }, { status: 200 });

    const { target_user_id, caller_token } = await request.json();
    if (!target_user_id) return NextResponse.json({ error: "no target" }, { status: 200 });

    const admin = createClient(supaUrl, serviceKey);

    // Verify the caller is an admin (using the token they passed).
    if (!caller_token) return NextResponse.json({ error: "not authorized" }, { status: 200 });
    const { data: caller } = await admin.auth.getUser(caller_token);
    if (!caller?.user) return NextResponse.json({ error: "not authorized" }, { status: 200 });
    const { data: callerProfile } = await admin.from("profiles").select("is_admin").eq("id", caller.user.id).maybeSingle();
    if (!callerProfile?.is_admin) return NextResponse.json({ error: "not authorized" }, { status: 200 });
    // Don't let an admin delete themselves by accident.
    if (caller.user.id === target_user_id) return NextResponse.json({ error: "You can't delete your own account here." }, { status: 200 });

    // Grab the target's email (for the goodbye email) before deletion.
    const { data: target } = await admin.from("profiles").select("email, full_name, company_name").eq("id", target_user_id).maybeSingle();
    let email = target?.email;
    if (!email) {
      try { const { data: au } = await admin.auth.admin.getUserById(target_user_id); email = au?.user?.email; } catch (e) {}
    }

    // Send the deletion email FIRST (while we still have the address).
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && email) {
      const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;background:#FBF3E4;border-radius:16px">
        <div style="text-align:center;font-size:22px;font-weight:800;color:#1c1c1c;margin-bottom:8px">Hype<span style="color:#7B6CD9">panda</span></div>
        <h2 style="color:#1c1c1c">Your account has been removed</h2>
        <p style="color:#6b6357;line-height:1.6">Your HypePanda account and associated data have been permanently deleted by our team. If you believe this was a mistake or have any questions, please contact us at <a href="mailto:support@hypepanda.in">support@hypepanda.in</a>.</p>
        <p style="color:#a89e8e;font-size:12px;margin-top:24px">HypePanda · a brand of Digistick Services Pvt. Ltd. · support@hypepanda.in</p>
      </div>`;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": "Bearer " + resendKey, "Content-Type": "application/json" },
          body: JSON.stringify({ from: "HypePanda <support@hypepanda.in>", to: [email], subject: "Your HypePanda account has been removed", html }),
        });
      } catch (e) {}
    }

    // Delete all rows that reference this user, across every table.
    const uid = target_user_id;
    const ops = [
      admin.from("notifications").delete().eq("user_id", uid),
      admin.from("team_messages").delete().eq("user_id", uid),
      admin.from("password_resets").delete().eq("user_id", uid),
      admin.from("email_verifications").delete().eq("user_id", uid),
      admin.from("pro_payments").delete().eq("user_id", uid),
      admin.from("profile_views_log").delete().eq("viewer_id", uid),
      admin.from("profile_views_log").delete().eq("creator_id", uid),
      admin.from("showcase").delete().eq("user_id", uid),
      admin.from("photos").delete().eq("creator_id", uid),
      admin.from("portfolio").delete().eq("creator_id", uid),
      admin.from("brands").delete().eq("agency_id", uid),
      admin.from("collaborations").delete().eq("brand_id", uid),
      admin.from("collaborations").delete().eq("creator_id", uid),
      admin.from("deals").delete().eq("business_id", uid),
      admin.from("deals").delete().eq("creator_id", uid),
      admin.from("messages").delete().eq("sender_id", uid),
    ];
    // Run them; ignore individual table errors (e.g. a column that doesn't exist
    // in this schema) so one missing table can't block the whole deletion.
    for (const op of ops) { try { await op; } catch (e) {} }

    // Delete the profile row.
    await admin.from("profiles").delete().eq("id", uid);

    // Finally delete the auth login account.
    let authErr = null;
    try { const { error } = await admin.auth.admin.deleteUser(uid); if (error) authErr = error.message; }
    catch (e) { authErr = String(e); }

    return NextResponse.json({ ok: true, emailed: !!email, authDeleted: !authErr, authError: authErr });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 200 });
  }
}
