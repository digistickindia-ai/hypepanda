"use client";

// The HypePanda mascot — cool panda with purple sunglasses.
// The purple lenses blink periodically. size = px, animate = gentle bob.
export default function Panda({ size = 120, animate = true, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 190"
      className={animate ? "blob" : ""}
      style={style}
    >
      <style>{`
        @keyframes pandaBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          94%, 96% { transform: scaleY(0.12); }
        }
        .pd-lens { transform-box: fill-box; transform-origin: center; animation: pandaBlink 4.5s ease-in-out infinite; }
      `}</style>
      <ellipse cx="90" cy="118" rx="68" ry="64" fill="#fff" stroke="#1c1c1c" strokeWidth="4" />
      <ellipse cx="42" cy="62" rx="26" ry="28" fill="#1c1c1c" />
      <ellipse cx="138" cy="62" rx="26" ry="28" fill="#1c1c1c" />
      <ellipse cx="42" cy="64" rx="13" ry="15" fill="#7B6CD9" />
      <ellipse cx="138" cy="64" rx="13" ry="15" fill="#7B6CD9" />
      <ellipse cx="62" cy="106" rx="26" ry="22" fill="#1c1c1c" />
      <ellipse cx="118" cy="106" rx="26" ry="22" fill="#1c1c1c" />
      <rect x="40" y="98" width="100" height="20" rx="10" fill="#1c1c1c" />
      <rect x="46" y="100" width="38" height="15" rx="7" className="pd-lens" fill="#7B6CD9" />
      <rect x="96" y="100" width="38" height="15" rx="7" className="pd-lens" fill="#7B6CD9" style={{ animationDelay: "0.05s" }} />
      <circle cx="58" cy="106" r="4" fill="#fff" opacity="0.9" />
      <circle cx="108" cy="106" r="4" fill="#fff" opacity="0.9" />
      <ellipse cx="90" cy="138" rx="9" ry="6" fill="#1c1c1c" />
      <path d="M76 152 Q90 164 104 152" stroke="#1c1c1c" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M104 150 L128 142" stroke="#7BC47F" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="132" cy="140" rx="6" ry="4" fill="#7BC47F" transform="rotate(-20 132 140)" />
    </svg>
  );
}
