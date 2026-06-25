// Fire a Meta Pixel event safely. No-ops if the pixel isn't loaded
// (e.g. pixel ID not set, or ad blocker present).
export function fbTrack(event, params) {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      if (params) window.fbq("track", event, params);
      else window.fbq("track", event);
    }
  } catch (e) {}
}
