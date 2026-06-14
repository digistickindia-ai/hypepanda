# HypePanda — Full setup guide

The complete marketplace is built. This guide covers everything you connect.
Order: 1) Database  2) Google login  3) Cashfree escrow  4) Instagram verify.

You already did 1 & 2 earlier. If your DB is from the first version, RE-RUN the
schema (step 1) — it adds deals, messages, notifications. It's safe to re-run.

=========================================================
1. DATABASE (re-run the new schema)
=========================================================
Supabase -> SQL Editor -> New query -> paste ALL of supabase-schema.sql -> Run.
This adds the deals, messages, and notifications tables and turns on realtime.

=========================================================
2. GOOGLE LOGIN  (already done)
=========================================================
Nothing to change. If you ever see login fail, re-check the redirect URL and
that your Gmail is a Test User in Google Cloud -> Audience.

=========================================================
3. CASHFREE  (you receive the money, you pay creators)
=========================================================
HOW MONEY FLOWS (manual settlement):
  Business pays -> money lands in YOUR Cashfree account ("secured")
  -> creator delivers -> business approves -> YOU pay the creator
  (minus your 10% commission) from your Payout queue in the app.

This means you only need a NORMAL Cashfree account — no marketplace/split
approval needed. Faster to launch; you control every payout.

SETUP:
A) Free account at https://www.cashfree.com -> Payment Gateway.
B) Start in TEST mode. Dashboard -> Developers -> API Keys ->
   copy "App ID" + "Secret Key".
C) Add to Vercel -> Settings -> Environment Variables:
       CASHFREE_APP_ID       = your app id
       CASHFREE_SECRET_KEY   = your secret key
       CASHFREE_MODE         = sandbox
D) Redeploy.
E) Test with Cashfree's test cards (in their docs).

PAYING CREATORS:
- After a business approves the work, the deal appears in your in-app
  Payout queue (Profile -> "Payout queue (admin)").
- It shows exactly how much to send the creator (amount minus your 10%).
- You send that via your bank / UPI / Cashfree Payouts, then tap
  "Mark as paid". The creator gets notified.

COMMISSION: set to 10% by default. The business sees the full price; the
creator sees what they'll receive; you keep the difference. To change the
rate, edit DEFAULT_COMMISSION in lib/me.js.

GOING LIVE: complete Cashfree KYC, switch CASHFREE_MODE to "production",
swap in production keys.

IMPORTANT (talk to your CA): since money passes through your account and you
pay creators, confirm the GST treatment — you may be collecting on the
creator's behalf, or it may count as your revenue. Get this right before
real money flows.

=========================================================
3b. MAKE YOURSELF ADMIN (for the payout queue)
=========================================================
After you've signed in once with your Google account:
Supabase -> SQL Editor -> run (with your email):

  update profiles set is_admin = true
  where id = (select id from auth.users where email = 'you@gmail.com');

Then in the app, Profile shows a "Payout queue (admin)" button.

=========================================================
4. INSTAGRAM VERIFICATION  (the verified badge + follower count)
=========================================================
This needs a Meta (Facebook) app and their review — the SLOWEST part, so start
it early. The code is ready and waiting for keys.

A) Go to https://developers.facebook.com -> My Apps -> Create App -> "Business".
B) Add the "Instagram" + "Facebook Login" products.
C) Settings -> Basic -> copy "App ID" and "App Secret".
D) Facebook Login -> Settings -> Valid OAuth Redirect URIs, add:
       https://hypepanda.vercel.app/api/instagram/callback
E) Add to Vercel env vars:
       INSTAGRAM_APP_ID      = your app id
       INSTAGRAM_APP_SECRET  = your app secret
F) Redeploy.
G) For real users (not just you), submit the app for review requesting
   "instagram_basic" + "pages_show_list". Until approved, only you and added
   testers can verify. This review can take days to weeks — that's Meta, not us.

Until Instagram is connected, creators simply show "Not yet verified" and no
follower count. Everything else works fully.

=========================================================
THE COMPLETE APP
=========================================================
PUBLIC
  /                         Landing page (Creator/Business/Agency router)

CREATOR
  /app                      Sign in
  /app/onboarding           5-step creator setup
  /app/home                 Panda HQ (strength, niche, rate, followers, offers)
  /app/profile              Profile + Instagram verify
  /app/deals                All their deals
  /app/chat                 Conversations
  /app/chat/[id]            Deal chat: accept/decline, deliver, get paid

BUSINESS / AGENCY
  /app/onboarding           4-step business setup
  /app/home                 Search + niche filters + creator cards
  /app/creator/[id]         Creator profile + "Send collab offer"
  /app/deals                All their deals
  /app/chat/[id]            Deal chat: pay into escrow, release payment

THE DEAL LIFECYCLE (fully built)
  Business sends offer -> Creator accepts -> Business pays (money to YOUR
  account, shown as "Payment secured") -> Creator delivers -> Business
  approves -> YOU pay the creator from the Payout queue -> Complete.
  Messaging + notifications happen throughout, in realtime.
  HypePanda keeps a 10% commission on every deal.

=========================================================
LAUNCH CHECKLIST
=========================================================
[ ] Re-run schema (step 1)
[ ] Cashfree keys in Vercel + redeploy (step 3)
[ ] Test full flow with two Google accounts (creator + business)
[ ] Start Meta app review for Instagram (step 4) — do this early
[ ] Cashfree KYC + Payouts for real money
[ ] When ready for public: publish the Google OAuth app + set Cashfree to production
