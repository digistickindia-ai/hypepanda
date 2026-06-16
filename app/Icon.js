"use client";

// Clean line icons (stroke-based) used across HypePanda instead of emojis.
// Usage: <Icon name="play" size={20} color="var(--ink)" />
const PATHS = {
  play: <path d="M6 4l14 8-14 8z" />,
  star: <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 21.4l1.4-6.8L2.2 9.9l6.9-.8z" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  rupee: <path d="M6 4h12M6 9h12M14 4c2.5 0 4 1.6 4 4s-1.5 4-4 4H9l6 8" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  film: <path d="M3 5h18v14H3zM7 5v14M17 5v14M3 9h4M3 14h4M17 9h4M17 14h4" />,
  check: <path d="M20 6L9 17l-5-5" />,
  camera: <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z" />,
  search: <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3" />,
  wallet: <path d="M20 12V8H6a2 2 0 010-4h12v4M4 6v12a2 2 0 002 2h14v-4M18 12a2 2 0 000 4h4v-4z" />,
  rocket: <path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.8-.8.8-2.2 0-3s-2.2-.8-3 0zM9 11a9 9 0 0112-7 9 9 0 01-7 12l-3 1-3-3zM15 9a1 1 0 100-2 1 1 0 000 2z" />,
  eye: <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z" />,
  heart: <path d="M20.8 5.6a5 5 0 00-7.1 0L12 7.3l-1.7-1.7a5 5 0 00-7.1 7.1l1.7 1.7L12 21.5l7.1-7.1 1.7-1.7a5 5 0 000-7.1z" />,
  panda: null, // handled by Panda.js component
};

export default function Icon({ name, size = 22, color = "currentColor", strokeWidth = 2, fill = "none", style = {} }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {path}
    </svg>
  );
}
