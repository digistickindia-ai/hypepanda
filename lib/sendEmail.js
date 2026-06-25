// Client helper to trigger a coordination email.
// IMPORTANT: uses the absolute canonical origin so the hypepanda.in -> www
// 301 redirect can't strip the POST body (which silently broke emails before).
export async function sendEmail(payload) {
  try {
    const base = (typeof window !== "undefined" && window.location && window.location.origin) || "https://www.hypepanda.in";
    // Always hit the canonical www origin to avoid a redirect on POST.
    const origin = base.replace("://hypepanda.in", "://www.hypepanda.in");
    const res = await fetch(origin + "/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    if (j && j.error) console.warn("sendEmail:", j.error);
    return j;
  } catch (e) {
    console.warn("sendEmail failed:", e);
    return { error: String(e) };
  }
}
