# HypePanda — Internal app setup (the part you do)

The code is 100% done. To make sign-in + profiles work with REAL data, you connect
a free Supabase database and Google login. ~15 minutes, all clicking + 2 copy-pastes.

Do these in order.

====================================================
PART A — Create the database (Supabase)
====================================================

1. Go to https://supabase.com -> "Start your project" -> sign in with GitHub.
2. Click "New project".
   - Name: hypepanda
   - Database password: make one up, SAVE IT somewhere.
   - Region: pick "South Asia (Mumbai)" (closest to your users).
   - Click "Create new project". Wait ~2 min while it sets up.

3. Create the tables:
   - Left sidebar -> "SQL Editor" -> "New query".
   - Open the file  supabase-schema.sql  (in this project), copy ALL of it,
     paste into the editor, click "Run".
   - You should see "Success. No rows returned". Done.

4. Get your two keys:
   - Left sidebar -> "Project Settings" (gear) -> "API".
   - Copy "Project URL"  ->  this is NEXT_PUBLIC_SUPABASE_URL
   - Copy "anon public" key  ->  this is NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Keep this tab open.

====================================================
PART B — Turn on Google login
====================================================

5. In Supabase: left sidebar -> "Authentication" -> "Sign In / Providers" ->
   find "Google" -> toggle it ON.
   It will ask for a "Client ID" and "Client Secret". Get those next:

6. Go to https://console.cloud.google.com
   - Create a project (name it HypePanda).
   - Search "OAuth consent screen" -> set User type = External -> fill app name
     "HypePanda", your email -> Save through the steps.
   - Search "Credentials" -> "Create Credentials" -> "OAuth client ID" ->
     Application type = "Web application".
   - Under "Authorized redirect URIs" add the callback URL that Supabase shows you
     on the Google provider screen (looks like:
     https://YOUR-PROJECT.supabase.co/auth/v1/callback )
   - Click Create. Copy the "Client ID" and "Client secret".

7. Back in Supabase Google provider screen: paste Client ID + Client secret -> Save.

====================================================
PART C — Plug the keys into the app
====================================================

8. LOCAL (to test on your laptop):
   - In this project folder, make a copy of  .env.example  named  .env.local
   - Paste your real URL and anon key into it. Save.
   - Run:  npm install   then   npm run dev
   - Open http://localhost:3000  -> click through -> Sign in with Google should work.

9. LIVE (Vercel):
   - Go to your project on https://vercel.com -> Settings -> "Environment Variables".
   - Add two:
       NEXT_PUBLIC_SUPABASE_URL        = your project URL
       NEXT_PUBLIC_SUPABASE_ANON_KEY   = your anon key
   - Also: in Supabase -> Authentication -> "URL Configuration" -> set
     "Site URL" to your live address (https://hypepanda.vercel.app).
   - Push the updated code to GitHub (GitHub Desktop -> Commit -> Push).
     Vercel rebuilds automatically.

DONE. Real users can now sign in and create creator profiles, saved in your database.

====================================================
The full flow you just built
====================================================
Landing (/)  ->  tap a role  ->  Sign in (/app)  ->  Google login
   ->  Onboarding (5 playful steps: name, city, niche, instagram, rate)
   ->  Home HQ (profile strength, niche, rate, offers)
   ->  Profile tab (view/edit, sign out)
   ->  Chat + Deals tabs (placeholders, built next)

Bottom tab bar: Home / Chat / Deals / Profile.

====================================================
What we build next
====================================================
- [ ] Real Instagram verification (auto follower count)
- [ ] Business side: search + filter + creator cards
- [ ] Real messaging
- [ ] Cashfree escrow on deals
