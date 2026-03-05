export type TargetType = "WORK" | "CHAPTER";

export type ScopeMode = "target" | "workChapters";

export type SortMode = "newest" | "oldest" | "top" | "bottom";

export type CommentUser = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

export type CommentMedia = {
  id: string;
  type: "COMMENT_IMAGE" | "COMMENT_GIF";
  url: string;
  contentType: string;
  sizeBytes: number;
};

export type CommentAttachment = {
  id: string;
  type: "IMAGE" | "GIF";
  media: CommentMedia;
};

export type CommentItem = {
  id: string;
  targetType: TargetType;
  targetId: string;
  parentId?: string | null;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  isHidden?: boolean;
  isSpoiler?: boolean;
  user: CommentUser;
  attachments?: CommentAttachment[];
  likeCount?: number;
  dislikeCount?: number;
  isPinned?: boolean;
  pinnedAt?: string | null;
  viewerLiked?: boolean;
  viewerDisliked?: boolean;
  userRating?: number | null;
  replies?: CommentItem[];
};

// Avoid a replies type intersection (CommentItem.replies vs DecoratedComment.replies)
// which can cause TS to infer replies items as CommentItem instead of DecoratedComment.
export type DecoratedComment = Omit<CommentItem, "replies"> & {
  createdAtLabel: string;
  editedAtLabel: string | null;
  displayName: string;
  replies?: DecoratedComment[];
};

export type ReplyTarget = {
  id: string;
  targetType: TargetType;
  targetId: string;
  displayName: string;
};
