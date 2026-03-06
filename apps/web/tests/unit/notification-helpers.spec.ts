import { describe, expect, it } from "vitest";

import {
  canSeeGatedNotificationContent,
  commentNotificationDedupeKey,
  extractMentionUsernames,
  newChapterNotificationDedupeKey,
} from "@/server/services/notifications/helpers";

describe("notification helpers", () => {
  it("extracts unique mention usernames from a comment body", () => {
    const mentions = extractMentionUsernames(
      "Hi @noel, meet @rika. Repeating @noel should dedupe, but @x should be ignored."
    );

    expect(mentions).toEqual(["noel", "rika"]);
  });

  it("builds stable dedupe keys for comment and chapter notifications", () => {
    expect(commentNotificationDedupeKey("COMMENT_NEW", "comment-1", "user-1")).toBe(
      "comment_new:comment-1:user-1"
    );
    expect(commentNotificationDedupeKey("COMMENT_REPLY", "comment-1", "user-2")).toBe(
      "comment_reply:comment-1:user-2"
    );
    expect(newChapterNotificationDedupeKey("chapter-9")).toBe("new_chapter:chapter-9");
  });

  it("respects adult and deviant gates when deciding notification recipients", () => {
    expect(
      canSeeGatedNotificationContent(
        { role: "USER", adultConfirmed: true, deviantLoveConfirmed: false },
        { adult: false, deviant: true }
      )
    ).toBe(false);

    expect(
      canSeeGatedNotificationContent(
        { role: "USER", adultConfirmed: true, deviantLoveConfirmed: true },
        { adult: true, deviant: true }
      )
    ).toBe(true);
  });
});
