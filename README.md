# HypePanda by Digistick

A complete, playful two-sided influencer marketplace.
Cream + multicolor blobs, panda mascot. Built on Next.js + Supabase + Cashfree.

## What's built
- Public landing page with Creator / Business / Agency router
- Google sign-in (Supabase auth)
- Role-aware onboarding (creator and business flows)
- Creator: panda HQ dashboard, profile, Instagram verification
- Business: creator search + niche filters + creator cards + profiles
- Full deal lifecycle: offer -> accept -> pay into escrow -> deliver -> release
- Realtime messaging per deal
- Notifications
- Cashfree escrow payment integration
- Instagram follower-verification integration

## To make it fully live
See SETUP.md — it walks through the database, Google, Cashfree, and Instagram
step by step. The code is 100% done; those are the external connections.

## Run locally
    npm install
    # copy .env.example to .env.local and fill in your keys
    npm run dev
    # open http://localhost:3000

## Deploy
Push to GitHub -> Vercel auto-builds. Add env vars in Vercel Settings.
