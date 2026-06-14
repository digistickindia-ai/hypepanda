import { createBrowserClient } from "@supabase/ssr";

// Reads your keys from environment variables (set in .env.local and in Vercel).
// Safe to expose — these are the PUBLIC keys, not secret ones.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
