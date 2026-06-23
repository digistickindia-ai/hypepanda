import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Validates a reset token and sets the new password (admin API, server-side).
// Requires: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return NextResponse.json({ error: "missing token/password" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "server not configured" }, { status: 200 });

    const supabase = createClient(supaUrl, serviceKey);

    const { data: row } = await supabase.from("password_resets").select("*").eq("token", token).maybeSingle();
    if (!row || row.used) return NextResponse.json({ error: "This reset link is invalid or already used." }, { status: 200 });
    if (new Date(row.expires_at) < new Date()) return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 200 });

    // update the user's password via admin API
    const { error: upErr } = await supabase.auth.admin.updateUserById(row.user_id, { password });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 200 });

    await supabase.from("password_resets").update({ used: true }).eq("token", token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 200 });
  }
}
