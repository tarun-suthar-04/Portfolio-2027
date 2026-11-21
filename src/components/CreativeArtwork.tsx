import React from 'react';

interface CreativeArtworkProps {
  workId: string;
}

/**
 * Bespoke atmospheric SVG compositions layered behind the ribbed-glass optical filter
 * so each Bento exhibition tile carries distinct visual form without external image dependencies.
 */
export const CreativeArtwork: React.FC<CreativeArtworkProps> = ({ workId }) => {
  switch (workId) {
    case 'portraits':
      return (
        <svg
          className="tile-art w-full h-full opacity-60"
          viewBox="0 0 400 500"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="p-glow" cx="50%" cy="38%" r="45%">
              <stop offset="0%" stopColor="#d4e1ff" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#5b4be0" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="185" r="140" fill="url(#p-glow)" />
          <ellipse cx="200" cy="175" rx="52" ry="68" fill="#0c0924" opacity="0.72" />
          <path
            d="M95 470 C105 320, 145 270, 200 270 C255 270, 295 320, 305 470 Z"
            fill="#070516"
            opacity="0.82"
          />
          <circle cx="222" cy="160" r="78" fill="none" stroke="#c8d8ff" strokeOpacity="0.35" strokeWidth="1.2" />
        </svg>
      );

    case 'geometric':
      return (
        <svg
          className="tile-art w-full h-full opacity-55"
          viewBox="0 0 320 320"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect x="44" y="44" width="232" height="232" fill="none" stroke="#b9ffd2" strokeOpacity="0.35" strokeWidth="1.2" />
          <circle cx="160" cy="160" r="88" fill="none" stroke="#80f0a8" strokeOpacity="0.5" strokeWidth="1.4" />
          <polygon points="160,54 252,218 68,218" fill="#d9ffc2" fillOpacity="0.16" stroke="#d9ffc2" strokeOpacity="0.45" />
        </svg>
      );

    case 'cinematic':
      return (
        <svg
          className="tile-art w-full h-full opacity-70"
          viewBox="0 0 600 280"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="c-beam" x1="0" y1="0.5" x2="1" y2="0.5">
              <stop offset="0%" stopColor="#ff3d0a" stopOpacity="0" />
              <stop offset="48%" stopColor="#ffe1a8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ff9a1a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="136" width="600" height="8" fill="url(#c-beam)" />
          <circle cx="310" cy="140" r="74" fill="#fff0cc" fillOpacity="0.22" />
          <circle cx="310" cy="140" r="34" fill="#fff8e6" fillOpacity="0.38" />
          <line x1="0" y1="36" x2="600" y2="36" stroke="#ffffff" strokeOpacity="0.14" />
          <line x1="0" y1="244" x2="600" y2="244" stroke="#ffffff" strokeOpacity="0.14" />
        </svg>
      );

    case 'editorial':
      return (
        <svg
          className="tile-art w-full h-full opacity-55"
          viewBox="0 0 320 320"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect x="38" y="32" width="118" height="256" fill="#ecd0ac" fillOpacity="0.18" />
          <rect x="172" y="64" width="110" height="192" fill="none" stroke="#f7e7d0" strokeOpacity="0.38" />
          <line x1="38" y1="160" x2="282" y2="160" stroke="#ffffff" strokeOpacity="0.22" />
        </svg>
      );

    case 'characters':
      return (
        <svg
          className="tile-art w-full h-full opacity-65"
          viewBox="0 0 320 320"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <circle cx="115" cy="118" r="64" fill="#80f0e0" fillOpacity="0.28" />
          <path
            d="M110 290 L132 145 L162 115 L194 145 L212 290 Z"
            fill="#02061c"
            fillOpacity="0.72"
            stroke="#80f0e0"
            strokeOpacity="0.45"
          />
          <circle cx="161" cy="88" r="24" fill="#02061c" stroke="#80f0e0" strokeOpacity="0.55" />
        </svg>
      );

    case 'advertising':
    default:
      return (
        <svg
          className="tile-art w-full h-full opacity-65"
          viewBox="0 0 320 320"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <circle cx="160" cy="128" r="76" fill="#fff0c8" fillOpacity="0.3" />
          <rect x="116" y="138" width="88" height="122" rx="18" fill="#180500" fillOpacity="0.65" stroke="#ffb15a" strokeOpacity="0.5" />
          <ellipse cx="160" cy="272" rx="70" ry="10" fill="#000000" fillOpacity="0.55" />
        </svg>
      );
  }
};

interface ProcessPreviewArtProps {
  stepId: string;
}

export const ProcessPreviewArt: React.FC<ProcessPreviewArtProps> = ({ stepId }) => {
  switch (stepId) {
    case 's1':
      return (
        <div className="w-full h-full bg-[#f1ece2] relative">
          <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <g fill="none" stroke="#111" strokeWidth="1.1" strokeDasharray="3 2">
              <rect x="8" y="10" width="30" height="24" />
              <rect x="45" y="10" width="30" height="24" />
              <rect x="82" y="10" width="30" height="24" />
            </g>
            <g fill="none" stroke="#111" strokeWidth="1.2" strokeLinecap="round">
              <circle cx="23" cy="22" r="5" />
              <path d="M50 30L58 16L66 28L70 20" />
              <path d="M90 28Q97 12 106 26" />
              <path d="M12 58H108M12 68H84M12 78H100" opacity=".45" />
            </g>
            <path d="M60 38V48" stroke="#e63b2e" strokeWidth="1.6" />
            <circle cx="60" cy="51" r="2" fill="#e63b2e" />
          </svg>
        </div>
      );

    case 's2':
      return (
        <div className="w-full h-full bg-[#0a0f24] relative">
          <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <rect x="8" y="14" width="104" height="62" rx="9" fill="#101a3a" stroke="#4f8bff" strokeWidth="1" />
            <rect x="18" y="26" width="72" height="4" rx="2" fill="#8cc8f5" />
            <rect x="18" y="36" width="58" height="4" rx="2" fill="#8cc8f5" opacity=".7" />
            <rect x="18" y="46" width="66" height="4" rx="2" fill="#8cc8f5" opacity=".5" />
            <rect x="88" y="46" width="2" height="8" fill="#fff" />
            <rect x="82" y="62" width="24" height="9" rx="4.5" fill="#4f8bff" />
          </svg>
        </div>
      );

    case 's3':
      return (
        <div className="w-full h-full bg-[#0a0a0c] relative">
          <div className="absolute inset-2.5 grid grid-cols-2 gap-1.5">
            <span className="rounded-[10px] bg-[linear-gradient(160deg,#ff5fa2,#2f6bff)]" />
            <span className="rounded-[10px] bg-[linear-gradient(160deg,#ffc400,#e63b2e)]" />
            <span className="rounded-[10px] bg-[linear-gradient(160deg,#7ff0e0,#0b3fd1)]" />
            <span className="rounded-[10px] bg-[linear-gradient(160deg,#8ae79a,#06133a)]" />
          </div>
        </div>
      );

    case 's4':
      return (
        <div className="w-full h-full bg-[linear-gradient(120deg,#0b3fd1,#7ff0e0_50%,#ffb15a)] relative">
          <div className="absolute inset-y-0 left-0 right-1/2 backdrop-blur-[9px] bg-[#080c1e]/35" />
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white" />
          <div className="absolute left-1/2 top-1/2 w-[26px] h-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white text-[#111] grid place-items-center text-xs font-bold">
            ↔
          </div>
        </div>
      );

    case 's5':
    default:
      return (
        <div className="w-full h-full bg-[#e9e4da] relative">
          <div className="absolute inset-3.5 bg-[linear-gradient(180deg,#06133a,#0b6a55_68%,#8ae79a)] shadow-[0_8px_20px_rgba(0,0,0,0.3)] grid place-items-center text-white text-[44px] font-light leading-none">
            ✱
          </div>
        </div>
      );
  }
};
