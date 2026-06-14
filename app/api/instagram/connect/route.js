import { NextResponse } from "next/server";

// Starts the Instagram (Facebook Login) flow. Requires a Meta app — see SETUP.
// Once approved, this redirects the creator to Instagram to authorize, then
// Meta calls /api/instagram/callback with a code we exchange for follower data.

export async function GET(request) {
  const appId = process.env.INSTAGRAM_APP_ID;
  const { origin } = new URL(request.url);
  if (!appId) {
    // Not configured yet — bounce back with a flag the profile page explains.
    return NextResponse.redirect(origin + "/app/profile?ig=notready");
  }
  const redirect = origin + "/api/instagram/callback";
  const scope = "instagram_basic,pages_show_list";
  const url = "https://www.facebook.com/v19.0/dialog/oauth"
    + "?client_id=" + appId
    + "&redirect_uri=" + encodeURIComponent(redirect)
    + "&scope=" + scope
    + "&response_type=code";
  return NextResponse.redirect(url);
}
