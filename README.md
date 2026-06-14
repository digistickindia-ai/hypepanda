# HypePanda by Digistick

The playful influencer marketplace. Cream + multicolor blobs, panda mascot.

This folder is a complete Next.js app.

- `/`     -> Public landing page (hero, Creator/Business/Agency router, trust section)
- `/app`  -> Sign-in screen ("app mode") — where people land after tapping a router card

---

## How to put it live (one-time setup, ~10 minutes)

You'll need two free accounts: GitHub (stores code) and Vercel (hosts the live site).

### Step 1 — Test it on your own laptop first (optional but nice)

Open a terminal in this folder and run:

    npm install
    npm run dev

Then open http://localhost:3000 in your browser. You'll see the welcome screen live.
Press Ctrl+C in the terminal to stop it.

### Step 2 — Put the code on GitHub

1. Make a free account at https://github.com
2. Click the "+" (top right) -> "New repository"
3. Name it: hypepanda  -> keep it Private -> click "Create repository"
4. On the next page, GitHub shows commands. Instead, the easiest path:
   - Download/keep this folder
   - Install GitHub Desktop: https://desktop.github.com (easiest, no command line)
   - In GitHub Desktop: File -> Add Local Repository -> pick this folder
   - It'll offer to publish -> click "Publish repository"

### Step 3 — Connect Vercel (makes it live)

1. Go to https://vercel.com -> "Sign Up" -> choose "Continue with GitHub"
2. Click "Add New..." -> "Project"
3. Find "hypepanda" in the list -> click "Import"
4. Leave every setting as-is -> click "Deploy"
5. Wait ~1 minute. You'll get a live link like  hypepanda.vercel.app

Open that link on your phone. Tap the browser's Share -> "Add to Home Screen"
to install it as an app with the panda icon.

---

## What's next (we build these together)

- [ ] Real Google sign-in (needs Supabase database)
- [ ] Pick: influencer onboarding OR brand search screen
- [ ] Instagram self-connect verification
- [ ] Messaging
- [ ] Cashfree escrow

When you've got the live link working, come back and tell me — we build screen 2.
