"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommentItem, ScopeMode, SortMode, TargetType } from "./types";

export type UseCommentsOptions = {
  targetType: TargetType;
  targetId: string;
  take: number;
  scope: ScopeMode;
  workId?: string;
  sortMode: SortMode;
  includeUserRating?: boolean;
  onError?: (msg: string) => void;
};

export function useComments({
  targetType,
  targetId,
  take,
  scope,
  workId,
  sortMode,
  includeUserRating,
  onError,
}: UseCommentsOptions) {
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [canModerate, setCanModerate] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const qs =
        scope === "workChapters"
          ? new URLSearchParams({
              scope: "workChapters",
              workId: String(workId || targetId),
              take: String(take || 100),
            })
          : new URLSearchParams({
              targetType,
              targetId,
              take: String(take || 100),
            });
      qs.set("sort", sortMode);
      if (includeUserRating) {
        qs.set("includeUserRating", "1");
      }

      const res = await fetch(`/api/comments?${qs.toString()}`, { cache: "no-store" as any });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        onError?.(data?.error || "Gagal memuat comments");
        setLoading(false);
        return;
      }
      setCanModerate(!!data?.canModerate);
      setComments((data?.comments || []) as CommentItem[]);
      setLoading(false);
    } catch {
      onError?.("Gagal memuat comments");
      setLoading(false);
    }
  }, [includeUserRating, onError, scope, sortMode, take, targetId, targetType, workId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, comments, setComments, canModerate, refresh };
}
