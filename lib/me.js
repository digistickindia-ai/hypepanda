"use client";

import { createClient } from "@/lib/supabase";

// Returns { user, profile } or redirects. Used at top of every internal screen.
export async function loadMe(router, { requireOnboarded = true } = {}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    router.replace("/app");
    return null;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || (requireOnboarded && !profile.onboarding_done)) {
    router.replace("/app/onboarding");
    return null;
  }
  return { user, profile, supabase };
}

export const NICHES = [
  "Beauty", "Fashion", "Food", "Fitness", "Tech",
  "Travel", "Lifestyle", "Gaming", "Comedy", "Finance",
];

export function inr(n) {
  if (n == null) return "—";
  return "₹" + Number(n).toLocaleString("en-IN");
}

export const DEFAULT_COMMISSION = 10;

// Creator payout = gross minus commission, rounded to whole rupees.
export function payout(amount, pct = DEFAULT_COMMISSION) {
  if (amount == null) return 0;
  return Math.round(Number(amount) * (1 - pct / 100));
}

export function commissionAmount(amount, pct = DEFAULT_COMMISSION) {
  if (amount == null) return 0;
  return Math.round(Number(amount) * (pct / 100));
}

export function fmtFollowers(n) {
  if (n == null) return "—";
  if (n >= 10000000) return (n / 10000000).toFixed(1) + "Cr";
  if (n >= 100000) return (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}
