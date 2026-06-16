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

=========================================================
5. ADMIN PANEL
=========================================================
A full admin control center lives at /admin (only visible to admins).
Tabs: Overview (stats + money), Users (verify/suspend), Deals (view/cancel),
Payouts (the payout queue).

TO ENABLE THE NEW ADMIN ACTIONS:
Run admin-patch.sql in Supabase SQL Editor (adds the "suspended" flag and the
admin update/delete policies). Safe to re-run.

Reach it from Profile -> "Admin panel" (button shows only for admins), or go
straight to yoursite.vercel.app/admin .

Powers:
- Overview: total users, creators vs businesses, deals, GMV, money held, your earnings
- Users: search/filter, verify or unverify creators, suspend/unsuspend users
  (suspended users get signed out and can't use the app)
- Deals: see every deal platform-wide, filter by status, cancel a deal
- Payouts: the to-pay queue, mark creators as paid

=========================================================
6. SHOWCASE VIDEOS (creator portfolio)
=========================================================
Creators upload 2-3 best-work videos during onboarding. You approve each one
in the admin panel before brands can see it. Videos live in Supabase Storage
(free up to 1 GB).

ONE-TIME SETUP:

A) Run portfolio-patch.sql in Supabase SQL Editor (creates the portfolio table
   + policies, adds showcase_done flag). Safe to re-run.

B) Create the storage bucket:
   Supabase -> Storage -> "New bucket"
     Name:   showcase
     Public bucket: YES (toggle on) -- so videos can play in the app
   Create.

C) Add upload + read policies for the bucket:
   Storage -> Policies -> on the "showcase" bucket -> New policy ->
   use "For full customization" and add these two:

   -- Allow signed-in users to upload
   Policy name: authed upload
   Allowed operation: INSERT
   Target roles: authenticated
   USING / WITH CHECK expression:  bucket_id = 'showcase'

   -- Allow anyone to read (since bucket is public this is usually automatic,
   -- but add it to be safe)
   Policy name: public read
   Allowed operation: SELECT
   Target roles: public
   USING expression:  bucket_id = 'showcase'

That's it. No separate server needed — Supabase Storage handles the files.

HOW IT FLOWS:
- New creator finishes profile -> must upload 2-3 videos -> can't reach home
  until done.
- Each video starts "pending". Brands do NOT see pending videos.
- You review in Admin -> Showcase tab: watch each, Approve or Reject.
- Approved videos appear on the creator's profile for brands ("Best work").
- You can take down an approved video anytime.

STORAGE LIMITS / COST:
- Free tier: 1 GB (~15-30 short phone videos). App caps each upload at 50 MB.
- Beyond free: ~$0.021/GB/month. Cheap, but watch it as you scale.
- If storage gets expensive later, we can switch to reel-link embeds instead.

=========================================================
7. PROFILE PHOTOS + NEW DESIGN (v2)
=========================================================
Run photos-patch.sql in Supabase SQL Editor (creates the photos table).
Photos reuse the same "showcase" storage bucket — no new bucket needed.

WHAT CHANGED IN v2:
- Cool sunglasses panda mascot everywhere (new app icon too).
- Login: scrolling creator photo wall + sign-in at the bottom.
- Business home: TikTok-style full-screen swipe feed of creator videos,
  each with name, location, niche, followers + a Hire button. Swipe up/down.
  (Shows approved videos only.)
- Creator profile: photo grid (creator uploads, instant, no approval) PLUS
  a Reels tab (the showcase videos, admin-approved).

NOTE: the business feed shows creators who have at least one APPROVED video.
So to see anyone in the feed, that creator must upload a reel AND you approve
it in Admin -> Showcase.

=========================================================
8. CREATOR PRO SUBSCRIPTION
=========================================================
Run pro-patch.sql in Supabase SQL Editor (adds Pro fields + analytics tables).

WHAT IT IS:
A "Go Pro" plan for creators — ₹499 for a 30-day pass, paid via Cashfree
(one-time payment, NOT auto-renew yet). Creators re-pay to extend.

PRO PERKS (auto-applied while pass is active):
- Featured: Pro creators sort first in brand search AND in the Reels feed
- ★ PRO badge on profile + creator cards (cards get a gold border)
- Half commission: Pro creators' deals are 5% instead of 10%
- Profile analytics: real "profile views" count (free creators see it blurred)
- More reels: upload up to 6 showcase videos instead of 3
- Priority ranking everywhere

HOW CREATORS UPGRADE:
Profile -> "Go Pro" button -> /app/pro -> pays via Cashfree -> Pro activates
for 30 days automatically (via /api/pro-webhook).

ADMIN:
- Admin -> Users: "Grant Pro" / "Remove Pro" button on each creator (gives a
  free 30-day pass — useful for comps, testing, or influencer deals).
- Admin -> Overview now shows Pro revenue + active Pro creator count.

REQUIRES: Cashfree keys in Vercel (same ones as deal payments:
CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_MODE). Until those are set,
the Go Pro button will say keys aren't configured.

LATER (true auto-renew): when Cashfree Subscriptions / UPI AutoPay is approved
on your account, we swap the one-time order in /api/pro-pay for a recurring
mandate. Everything else (perks, gating, UI) stays the same.

=========================================================
9. LEGAL PAGES (required for payment gateway)
=========================================================
Six legal pages are live at:
  /legal/terms     — Terms & Conditions
  /legal/privacy   — Privacy Policy
  /legal/refund    — Refund & Cancellation Policy
  /legal/shipping  — Delivery Policy (gateways require this even for digital)
  /legal/contact   — Contact Us
  /legal/about     — About

They're linked from the landing-page footer and the login screen.
All are written for the brand HypePanda operating under
Digistick Services Private Limited, Sector 68, Noida.

>>> ONE THING TO DO: replace [SUPPORT_EMAIL] with your real support/legal
    email. It appears in the terms, privacy, refund, shipping, contact, and
    about pages. Find-and-replace [SUPPORT_EMAIL] across the app/legal folder.

IMPORTANT (honest note): these are solid, standard, gateway-compliant
templates — good to launch with and to satisfy Cashfree's review. Because
HypePanda holds brand payments and pays out creators (money passing through
Digistick's account), have a CA/lawyer review the Terms, Refund, and
commission/GST language before scaling.
