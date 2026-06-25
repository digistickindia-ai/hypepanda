import { NextResponse } from "next/server";

// Returns just the Paytm MID + mode so the client can preload the checkout
// script on page open (no order is created here).
export async function GET() {
  const mid = (process.env.PAYTM_MID || "").trim();
  const mode = (process.env.PAYTM_MODE || "production").trim();
  if (!mid) return NextResponse.json({ error: "not configured" }, { status: 200 });
  return NextResponse.json({ mid, mode });
}
