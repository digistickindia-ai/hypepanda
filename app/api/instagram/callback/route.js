import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Exchanges the code for a token, fetches the creator's real follower count,
// and marks them verified. Meta app review is required before this works live.

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  try {
    if (code && appId && appSecret) {
      const redirect = origin + "/api/instagram/callback";
      // 1) code -> access token
      const tokRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token"
        + "?client_id=" + appId + "&client_secret=" + appSecret
        + "&redirect_uri=" + encodeURIComponent(redirect) + "&code=" + code);
      const tok = await tokRes.json();
      const accessToken = tok.access_token;

      // 2) find the IG business account + followers
      const pagesRes = await fetch("https://graph.facebook.com/v19.0/me/accounts?access_token=" + accessToken);
      const pages = await pagesRes.json();
      let followers = null, igId = null;
      const pageId = pages?.data?.[0]?.id;
      if (pageId) {
        const igRes = await fetch("https://graph.facebook.com/v19.0/" + pageId + "?fields=instagram_business_account&access_token=" + accessToken);
        const ig = await igRes.json();
        igId = ig?.instagram_business_account?.id;
        if (igId) {
          const fRes = await fetch("https://graph.facebook.com/v19.0/" + igId + "?fields=followers_count,username&access_token=" + accessToken);
          const f = await fRes.json();
          followers = f.followers_count ?? null;
        }
      }

      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          instagram_connected: true,
          instagram_user_id: igId,
          followers: followers,
        }).eq("id", user.id);
      }
    }
  } catch (e) { /* fall through */ }

  return NextResponse.redirect(origin + "/app/profile?ig=done");
}
