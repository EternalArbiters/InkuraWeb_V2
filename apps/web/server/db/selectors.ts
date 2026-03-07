import "server-only";

import type { Prisma } from "@prisma/client";

/**
 * Prisma select/include presets.
 *
 * Goal (Stage 7): avoid copy-paste of large include graphs across routes/services.
 * Keep these small and composable.
 */

// -----------------------------
// Common leaf selects
// -----------------------------

export const userNameSelect = {
  username: true,
  name: true,
} as const satisfies Prisma.UserSelect;

export const userPublicSelect = {
  id: true,
  username: true,
  name: true,
  image: true,
} as const satisfies Prisma.UserSelect;

export const nameSlugSelect = {
  name: true,
  slug: true,
} as const;

export const idNameSlugSelect = {
  id: true,
  name: true,
  slug: true,
} as const;

export const mediaObjectSelect = {
  id: true,
  type: true,
  url: true,
  contentType: true,
  sizeBytes: true,
} as const satisfies Prisma.MediaObjectSelect;

export const comicPageSelect = {
  id: true,
  imageUrl: true,
  order: true,
} as const satisfies Prisma.ComicPageSelect;

export const chapterListItemSelect = {
  id: true,
  number: true,
  title: true,
} as const satisfies Prisma.ChapterSelect;

// -----------------------------
// Work presets
// -----------------------------

export const workCardSelect = {
  id: true,
  slug: true,
  title: true,
  coverImage: true,
  updatedAt: true,
  type: true,
  comicType: true,
  likeCount: true,
  ratingAvg: true,
  ratingCount: true,
  isMature: true,
  language: true,
  completion: true,
  chapterCount: true,
  publishType: true,

  warningTags: { select: nameSlugSelect },
  author: { select: userNameSelect },
  translator: { select: userNameSelect },
} as const satisfies Prisma.WorkSelect;

export const studioWorkRowSelect = {
  id: true,
  slug: true,
  title: true,
  type: true,
  status: true,
  updatedAt: true,
  publishType: true,
  authorId: true,
  coverImage: true,
  seriesOrder: true,
  series: {
    select: {
      id: true,
      title: true,
      slug: true,
    },
  },
} as const satisfies Prisma.WorkSelect;

// -----------------------------
// Comments presets
// -----------------------------

export const commentAttachmentInclude = {
  media: { select: mediaObjectSelect },
} as const satisfies Prisma.CommentAttachmentInclude;

export const commentListInclude = {
  user: { select: userPublicSelect },
  attachments: { include: commentAttachmentInclude },
} as const satisfies Prisma.CommentInclude;

// -----------------------------
// Notifications presets
// -----------------------------

export const notificationSelect = {
  id: true,
  type: true,
  title: true,
  body: true,
  href: true,
  isRead: true,
  createdAt: true,
  workId: true,
  chapterId: true,
  actorId: true,
} as const satisfies Prisma.NotificationSelect;
