export type ReviewUser = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

export type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  isSpoiler: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  viewerVoted: boolean;
  isMine: boolean;
};

export type ReviewSort = "helpful" | "top" | "bottom" | "newest" | "oldest";
