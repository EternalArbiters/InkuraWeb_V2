type ReaderFloatingSeedProps = {
  chapterId: string;
  initialLiked: boolean;
  initialLikeCount: number;
};

export default function ReaderFloatingSeed({
  chapterId,
  initialLiked,
  initialLikeCount,
}: ReaderFloatingSeedProps) {
  return (
    <div
      id="reader-floating-seed"
      hidden
      aria-hidden="true"
      data-chapter-id={chapterId}
      data-liked={initialLiked ? "1" : "0"}
      data-like-count={String(initialLikeCount)}
    />
  );
}
