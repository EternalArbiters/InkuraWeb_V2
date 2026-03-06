import "server-only";

export type CommentNotificationType = "COMMENT_NEW" | "COMMENT_REPLY" | "COMMENT_MENTION";

export type NotificationGateUser = {
  role: string;
  adultConfirmed: boolean;
  deviantLoveConfirmed: boolean;
};

export type NotificationGateRequirement = {
  adult: boolean;
  deviant: boolean;
};

export function extractMentionUsernames(body: string): string[] {
  const re = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{2,32})/g;
  const out: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = re.exec(body)) !== null) {
    const username = String(match[2] || "").trim();
    if (username) out.push(username);
  }

  return Array.from(new Set(out));
}

export function canSeeGatedNotificationContent(
  user: NotificationGateUser,
  req: NotificationGateRequirement
): boolean {
  if (user.role === "ADMIN") return true;
  if (req.deviant) return user.adultConfirmed && user.deviantLoveConfirmed;
  if (req.adult) return user.adultConfirmed;
  return true;
}

export function commentNotificationDedupeKey(
  type: CommentNotificationType,
  commentId: string,
  userId: string
): string {
  if (type === "COMMENT_NEW") return `comment_new:${commentId}:${userId}`;
  if (type === "COMMENT_REPLY") return `comment_reply:${commentId}:${userId}`;
  return `comment_mention:${commentId}:${userId}`;
}

export function newChapterNotificationDedupeKey(chapterId: string): string {
  return `new_chapter:${chapterId}`;
}
