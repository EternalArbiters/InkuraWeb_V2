import type { ReviewUser } from "./types";

export function displayName(u: ReviewUser) {
  return u.name || u.username || "Unknown";
}
