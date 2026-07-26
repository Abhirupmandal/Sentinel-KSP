import React from 'react';

/**
 * Shared Cyber-Intelligence Brand Logo Component for Sentinel Engine
 * 
 * Renders a dark-tech hexagon emblem featuring a thin cyan outline,
 * radar sweep motif, concentric target rings, and a digital eye / secure-node core.
 * Centralized for consistent rendering across all pages and roles.
 */
export function SentinelLogoIcon({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Glow Filter */}
        <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Radar Sweep Gradient */}
        <radialGradient id="radarSweepGrad" cx="24" cy="24" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00d1ff" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00d1ff" stopOpacity="0" />
        </radialGradient>

        {/* Thin Outer Hexagon Gradient */}
        <linearGradient id="hexOutlineGrad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00d1ff" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Hexagonal Outer Frame */}
      <polygon
        points="24,4 41,14 41,34 24,44 7,34 7,14"
        fill="#070c18"
        fillOpacity="0.92"
        stroke="url(#hexOutlineGrad)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        filter="url(#radarGlow)"
      />

      {/* Outer Radar Target Ring */}
      <circle
        cx="24"
        cy="24"
        r="14"
        stroke="#00d1ff"
        strokeWidth="1"
        strokeOpacity="0.25"
        strokeDasharray="3 3"
      />

      {/* Inner Radar Target Ring */}
      <circle
        cx="24"
        cy="24"
        r="8"
        stroke="#00d1ff"
        strokeWidth="1"
        strokeOpacity="0.45"
      />

      {/* Radar Sweep Wedge */}
      <path
        d="M24 24 L38 24 A14 14 0 0 0 24 10 Z"
        fill="url(#radarSweepGrad)"
        opacity="0.6"
      />

      {/* Radar Active Sweep Line */}
      <line
        x1="24"
        y1="24"
        x2="38"
        y2="24"
        stroke="#00d1ff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Cyber Eye / Secure Lens Contour */}
      <path
        d="M13 24 C17 18 31 18 35 24 C31 30 17 30 13 24 Z"
        stroke="#38bdf8"
        strokeWidth="1.2"
        strokeOpacity="0.85"
        fill="none"
      />

      {/* Cardinal Crosshair Ticks */}
      <line x1="24" y1="6" x2="24" y2="8" stroke="#00d1ff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="40" x2="24" y2="42" stroke="#00d1ff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="24" x2="8" y2="24" stroke="#00d1ff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="40" y1="24" x2="42" y2="24" stroke="#00d1ff" strokeWidth="1.5" strokeLinecap="round" />

      {/* Central Secure-Node Pupil Core */}
      <circle cx="24" cy="24" r="2.5" fill="#ffffff" filter="url(#radarGlow)" />
    </svg>
  );
}

export default function BrandLogo({
  compact = false,
  size = 'md',
  className = '',
  title = 'Sentinel Engine',
  subtitle = 'Karnataka State Police Cyber Command Center',
}) {
  const iconSizes = {
    sm: 32,
    md: 38,
    lg: 44,
  };

  const currentSize = iconSizes[size] || iconSizes.md;

  if (compact) {
    return (
      <div className={`flex items-center justify-center ${className}`} title={`${title} — ${subtitle}`}>
        <div className="p-1 rounded-xl bg-[#00d1ff]/10 border border-[#00d1ff]/30 shadow-[0_0_12px_rgba(0,209,255,0.2)]">
          <SentinelLogoIcon size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem Icon Container */}
      <div className="flex items-center justify-center shrink-0 p-1 rounded-xl bg-[#00d1ff]/10 border border-[#00d1ff]/30 shadow-[0_0_15px_rgba(0,209,255,0.25)] transition-all duration-300 hover:border-[#00d1ff]/50">
        <SentinelLogoIcon size={currentSize} />
      </div>

      {/* Typography Block */}
      <div className="flex flex-col justify-center min-w-0">
        <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-sans truncate flex items-center gap-1">
          <span>Sentinel</span>
          <span className="text-[#00d1ff] drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]">Engine</span>
        </h1>
        <p className="text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-400 tracking-normal whitespace-nowrap mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
