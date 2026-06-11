export type CommunityBadgeTone =
  | "PURPLE"
  | "INDIGO"
  | "BLUE"
  | "GREEN"
  | "YELLOW"
  | "ORANGE"
  | "RED"
  | "PLATINUM"
  | "GOLD"
  | "GRAY";

export type CommunityIdentityBadgeKind = "ADMIN" | "MAIN" | "DONOR" | "SPECIAL" | "ROLE";

export type CommunityIdentityBadge = {
  kind: CommunityIdentityBadgeKind;
  label: string;
  tone: CommunityBadgeTone;
  badgeKey?: string | null;
  // MAIN badge only: split parts for gem-icon (creator) + ribbon (noble) rendering
  creatorTitle?: string | null;
  nobleTitle?: string | null;
  creatorTone?: CommunityBadgeTone | null;
  nobleTone?: CommunityBadgeTone | null;
};
