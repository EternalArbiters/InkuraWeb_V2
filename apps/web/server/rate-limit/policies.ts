import "server-only";

export type RateLimitIdentifierMode = "ip" | "user" | "user_or_ip" | "user_and_ip";
export type RateLimitWindow = `${number} ${"s" | "m" | "h"}`;

export type RateLimitPolicy = {
  limit: number;
  window: RateLimitWindow;
  identifier: RateLimitIdentifierMode;
};

export const RATE_LIMIT_POLICIES = {
  "auth.register": { limit: 3, window: "1 h", identifier: "ip" },
  "auth.passwordReset.request": { limit: 3, window: "1 h", identifier: "ip" },
  "auth.passwordReset.confirm": { limit: 5, window: "1 h", identifier: "ip" },

  "comment.create": { limit: 6, window: "1 m", identifier: "user_or_ip" },
  "comment.edit": { limit: 10, window: "10 m", identifier: "user" },
  "comment.delete": { limit: 10, window: "10 m", identifier: "user" },
  "comment.react": { limit: 40, window: "1 m", identifier: "user" },

  "upload.presign": { limit: 60, window: "10 m", identifier: "user_and_ip" },
  "upload.presign.pages": { limit: 600, window: "15 m", identifier: "user" },
  "upload.avatar.presign": { limit: 20, window: "1 h", identifier: "user_and_ip" },
  "upload.commit": { limit: 120, window: "10 m", identifier: "user_and_ip" },

  "work.bookmark": { limit: 40, window: "1 m", identifier: "user" },
  "work.like": { limit: 40, window: "1 m", identifier: "user" },
  "work.rate": { limit: 30, window: "1 m", identifier: "user" },
  "chapter.like": { limit: 40, window: "1 m", identifier: "user" },
  "user.follow": { limit: 30, window: "1 m", identifier: "user" },
  "report.create": { limit: 5, window: "1 h", identifier: "user_or_ip" },

  "studio.work.create": { limit: 10, window: "1 h", identifier: "user" },
  "studio.chapter.create": { limit: 20, window: "1 h", identifier: "user" },
} as const satisfies Record<string, RateLimitPolicy>;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES;
