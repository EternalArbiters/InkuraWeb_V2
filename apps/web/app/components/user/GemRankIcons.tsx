"use client";

import type { FC } from "react";

type Props = { size?: number; className?: string };

// All gems are stroke-only (currentColor, no fill) — looks clean on any colored background.

export function DiamondGem({ size = 12, className }: Props) {
  return (
    <svg width={Math.round(size * 0.75)} height={size} viewBox="0 0 9 12" fill="none" aria-hidden="true" className={className}>
      <path d="M4.5,0.5 L8.5,4 L4.5,11.5 L0.5,4Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <line x1="0.5" y1="4" x2="8.5" y2="4" stroke="currentColor" strokeWidth="0.75" />
    </svg>
  );
}

export function RubyGem({ size = 12, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
      <path d="M3,4 L6,2 L9,4 L9,8 L6,10 L3,8Z" stroke="currentColor" strokeWidth="0.7" strokeLinejoin="round" />
    </svg>
  );
}

export function SapphireGem({ size = 12, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <path d="M4,0.5 L8,0.5 L11.5,4 L11.5,8 L8,11.5 L4,11.5 L0.5,8 L0.5,4Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <line x1="0.5" y1="4" x2="11.5" y2="4" stroke="currentColor" strokeWidth="0.7" />
    </svg>
  );
}

export function EmeraldGem({ size = 12, className }: Props) {
  return (
    <svg width={Math.round(size * 1.4)} height={size} viewBox="0 0 16 11" fill="none" aria-hidden="true" className={className}>
      <path d="M4,0.5 L12,0.5 L15.5,3.5 L15.5,7.5 L12,10.5 L4,10.5 L0.5,7.5 L0.5,3.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <line x1="0.5" y1="3.5" x2="15.5" y2="3.5" stroke="currentColor" strokeWidth="0.7" />
    </svg>
  );
}

export function PearlGem({ size = 12, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <rect x="0.5" y="0.5" width="11" height="11" rx="3" stroke="currentColor" strokeWidth="1" />
      <line x1="0.5" y1="4" x2="11.5" y2="4" stroke="currentColor" strokeWidth="0.7" />
    </svg>
  );
}

export function CitrineGem({ size = 12, className }: Props) {
  return (
    <svg width={size} height={Math.round(size * 0.87)} viewBox="0 0 12 10.4" fill="none" aria-hidden="true" className={className}>
      <path d="M3,0.5 L9,0.5 L11.5,5.2 L9,9.9 L3,9.9 L0.5,5.2Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <line x1="0.5" y1="3.2" x2="11.5" y2="3.2" stroke="currentColor" strokeWidth="0.7" />
    </svg>
  );
}

export function GarnetGem({ size = 12, className }: Props) {
  return (
    <svg width={Math.round(size * 0.75)} height={size} viewBox="0 0 9 12" fill="none" aria-hidden="true" className={className}>
      <path d="M4.5,11.5 C4.5,11.5 0.5,7 0.5,4.5 C0.5,2.3 2.3,0.5 4.5,0.5 C6.7,0.5 8.5,2.3 8.5,4.5 C8.5,7 4.5,11.5 4.5,11.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <line x1="0.6" y1="3.5" x2="8.4" y2="3.5" stroke="currentColor" strokeWidth="0.7" />
    </svg>
  );
}

const GEM_MAP: Record<string, FC<Props>> = {
  PURPLE: DiamondGem,
  INDIGO: RubyGem,
  BLUE:   SapphireGem,
  GREEN:  EmeraldGem,
  YELLOW: PearlGem,
  ORANGE: CitrineGem,
  RED:    GarnetGem,
};

export default function GemRankIcon({ tone, size = 12, className }: { tone: string; size?: number; className?: string }) {
  const Icon = GEM_MAP[tone];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}
