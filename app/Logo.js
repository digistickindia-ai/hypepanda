"use client";

// HypePanda logo: bubbly "panda" wordmark with the cool panda head at the
// top-right, whose purple sunglass-lenses blink. `height` controls overall size.
export default function Logo({ height = 38, color = "var(--ink)" }) {
  // wordmark aspect ~ 3.2:1 including the panda head bump on top-right
  const w = height * 3.2;
  return (
    <div style={{ display: "inline-flex", alignItems: "flex-end", lineHeight: 0 }}>
      <svg height={height} viewBox="0 0 320 100" style={{ overflow: "visible" }} aria-label="HypePanda">
        <style>{`
          @keyframes hpBlink {
            0%, 92%, 100% { transform: scaleY(1); }
            95%, 97% { transform: scaleY(0.1); }
          }
          .hp-lens { transform-box: fill-box; transform-origin: center; animation: hpBlink 4.5s ease-in-out infinite; }
        `}</style>

        {/* Wordmark "panda" — bold rounded, outlined */}
        <text x="0" y="82" fontFamily="'Baloo 2', 'Quicksand', system-ui, sans-serif" fontSize="92" fontWeight="800" fill={color} style={{ letterSpacing: "-3px" }}>panda</text>

        {/* Panda head, top-right */}
        <g transform="translate(232, 2)">
          {/* ears */}
          <ellipse cx="20" cy="20" rx="15" ry="16" fill={color} />
          <ellipse cx="68" cy="20" rx="15" ry="16" fill={color} />
          <ellipse cx="20" cy="21" rx="7.5" ry="8.5" fill="#7B6CD9" />
          <ellipse cx="68" cy="21" rx="7.5" ry="8.5" fill="#7B6CD9" />
          {/* head */}
          <ellipse cx="44" cy="46" rx="38" ry="36" fill="#fff" stroke={color} strokeWidth="3" />
          {/* eye patches */}
          <ellipse cx="30" cy="42" rx="14" ry="12" fill={color} />
          <ellipse cx="58" cy="42" rx="14" ry="12" fill={color} />
          {/* sunglasses */}
          <rect x="18" y="38" width="52" height="11" rx="5.5" fill={color} />
          <rect x="21" y="39" width="20" height="8.5" rx="4" className="hp-lens" fill="#7B6CD9" />
          <rect x="47" y="39" width="20" height="8.5" rx="4" className="hp-lens" fill="#7B6CD9" style={{ animationDelay: "0.04s" }} />
          {/* nose + mouth */}
          <ellipse cx="44" cy="60" rx="4.5" ry="3" fill={color} />
          <path d="M37 67 Q44 73 51 67" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* green snack */}
          <path d="M51 65 L64 61" stroke="#7BC47F" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="66" cy="60" rx="3.5" ry="2.5" fill="#7BC47F" />
        </g>
      </svg>
    </div>
  );
}
