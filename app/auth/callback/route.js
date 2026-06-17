import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // next may be URL-encoded; default to home
  let next = searchParams.get("next") || "/app/home";
  try { next = decodeURIComponent(next); } catch (e) {}
  if (!next.startsWith("/")) next = "/app/home";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(list) { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // send back to login with an error flag rather than a logged-out home
      return NextResponse.redirect(`${origin}/app?error=auth`);
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
