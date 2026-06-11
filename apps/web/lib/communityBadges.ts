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
  // MAIN badge only: creator rank tone, used to pick the gem outline icon shown inside the ribbon
  creatorTone?: CommunityBadgeTone | null;
};
