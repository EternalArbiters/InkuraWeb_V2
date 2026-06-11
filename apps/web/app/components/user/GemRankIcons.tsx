"use client";

import type { FC } from "react";

type Props = { size?: number; className?: string };

// #1 PURPLE — Diamond cut (elongated, pointed top & bottom)
export function DiamondGem({ size = 14, className }: Props) {
  return (
    <svg
      width={Math.round(size * 0.75)}
      height={size}
      viewBox="0 0 12 16"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="gr-purple" x1="0" y1="0" x2="12" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
      </defs>
      {/* crown + pavilion */}
      <path d="M6,0 L11,5 L12,8 L6,16 L0,8 L1,5Z" fill="url(#gr-purple)" />
      {/* top facet glint */}
      <path d="M6,0 L1,5 L6,3.5Z" fill="white" fillOpacity={0.3} />
    </svg>
  );
}

// #2 INDIGO — Round brilliant (circle, radial gradient)
export function RubyGem({ size = 14, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <radialGradient id="gr-indigo" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="55%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </radialGradient>
      </defs>
      <circle cx="6" cy="6" r="6" fill="url(#gr-indigo)" />
      {/* highlight ellipse */}
      <ellipse
        cx="4.2"
        cy="3.8"
        rx="2"
        ry="1.2"
        fill="white"
        fillOpacity={0.3}
        transform="rotate(-25 4.2 3.8)"
      />
    </svg>
  );
}

// #3 BLUE — Octagon (sapphire cut)
export function SapphireGem({ size = 14, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="gr-blue" x1="0" y1="0" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <path d="M4,0 L8,0 L12,4 L12,8 L8,12 L4,12 L0,8 L0,4Z" fill="url(#gr-blue)" />
      <path d="M4,0 L8,0 L6,3Z" fill="white" fillOpacity={0.28} />
    </svg>
  );
}

// #4 GREEN — Emerald cut (wide horizontal rectangle with cut corners)
export function EmeraldGem({ size = 14, className }: Props) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.71)}
      viewBox="0 0 14 10"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="gr-green" x1="0" y1="0" x2="14" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>
      <path d="M3,0 L11,0 L14,3 L14,7 L11,10 L3,10 L0,7 L0,3Z" fill="url(#gr-green)" />
      <path d="M3,0 L11,0 L10,2 L4,2Z" fill="white" fillOpacity={0.25} />
    </svg>
  );
}

// #5 YELLOW — Cushion cut (rounded square)
export function PearlGem({ size = 14, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="gr-yellow" x1="0" y1="0" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="12" height="12" rx="3.5" fill="url(#gr-yellow)" />
      <path d="M1.5,1.5 L5,1.5 L3,4Z" fill="white" fillOpacity={0.3} />
    </svg>
  );
}

// #6 ORANGE — Hexagon (citrine/flat-top cut)
export function CitrineGem({ size = 14, className }: Props) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.87)}
      viewBox="0 0 12 10.4"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="gr-orange" x1="0" y1="0" x2="12" y2="10.4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
      </defs>
      <path d="M3,0 L9,0 L12,5.2 L9,10.4 L3,10.4 L0,5.2Z" fill="url(#gr-orange)" />
      <path d="M3,0 L9,0 L8,2.5 L4,2.5Z" fill="white" fillOpacity={0.25} />
    </svg>
  );
}

// #7 RED — Pear/teardrop cut (rounded top, pointed bottom)
export function GarnetGem({ size = 14, className }: Props) {
  return (
    <svg
      width={Math.round(size * 0.75)}
      height={size}
      viewBox="0 0 12 16"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="gr-red" x1="0" y1="0" x2="12" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
      </defs>
      {/* pear: rounded top, pointed bottom */}
      <path
        d="M6,16 L1,9 C-0.5,4 2,0 6,0 C10,0 12.5,4 11,9Z"
        fill="url(#gr-red)"
      />
      <ellipse cx="6" cy="4.5" rx="2.5" ry="1.5" fill="white" fillOpacity={0.25} />
    </svg>
  );
}

// ─── Lookup map ────────────────────────────────────────────────────────────────

const GEM_MAP: Record<string, FC<Props>> = {
  PURPLE: DiamondGem,
  INDIGO: RubyGem,
  BLUE: SapphireGem,
  GREEN: EmeraldGem,
  YELLOW: PearlGem,
  ORANGE: CitrineGem,
  RED: GarnetGem,
};

export default function GemRankIcon({
  tone,
  size = 14,
  className,
}: {
  tone: string;
  size?: number;
  className?: string;
}) {
  const Icon = GEM_MAP[tone];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}
