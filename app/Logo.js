"use client";

// Full HypePanda logo (exact uploaded artwork, background removed).
// Aspect ratio ~441:238. `height` controls size.
export default function Logo({ height = 40, style = {} }) {
  return (
    <img
      src="/logo.png"
      alt="HypePanda"
      style={{ height, width: "auto", display: "block", ...style }}
    />
  );
}
