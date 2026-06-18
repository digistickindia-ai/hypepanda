import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// The verification link lands here. Validate the token, mark verified, redirect.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.redirect(`${origin}/app/home?verify=invalid`);

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.redirect(`${origin}/app/home?verify=error`);

  const supabase = createClient(supaUrl, serviceKey);

  const { data: row } = await supabase.from("email_verifications").select("*").eq("token", token).single();
  if (!row || row.used) return NextResponse.redirect(`${origin}/app/home?verify=invalid`);

  await supabase.from("profiles").update({ email_verified: true }).eq("id", row.user_id);
  await supabase.from("email_verifications").update({ used: true }).eq("token", token);

  return NextResponse.redirect(`${origin}/app/home?verify=success`);
}
