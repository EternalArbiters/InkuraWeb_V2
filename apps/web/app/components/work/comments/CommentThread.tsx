"use client";

import type { DecoratedComment } from "./types";
import CommentCard, { type CommentCardProps } from "./CommentCard";

export default function CommentThread({
  comments,
  ...cardProps
}: {
  comments: DecoratedComment[];
} & Omit<CommentCardProps, "comment" | "depth">) {
  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <CommentCard key={c.id} {...cardProps} comment={c} depth={0} />
      ))}
    </div>
  );
}
