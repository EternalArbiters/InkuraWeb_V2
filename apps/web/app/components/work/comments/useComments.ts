"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { getOrFetchClientResource, mutateClientResource, seedClientResource } from "@/lib/clientResourceCache";
import type { CommentItem, ScopeMode, SortMode, TargetType } from "./types";

export type UseCommentsOptions = {
  targetType: TargetType;
  targetId: string;
  take: number;
  scope: ScopeMode;
  workId?: string;
  sortMode: SortMode;
  includeUserRating?: boolean;
  initialComments?: CommentItem[];
  initialCanModerate?: boolean;
  onError?: (msg: string) => void;
};

type CommentsPayload = {
  comments: CommentItem[];
  canModerate: boolean;
};

export function useComments({
  targetType,
  targetId,
  take,
  scope,
  workId,
  sortMode,
  includeUserRating,
  initialComments,
  initialCanModerate,
  onError,
}: UseCommentsOptions) {
  const hasInitial = !!initialComments;
  const [loading, setLoading] = useState(!hasInitial);
  const [comments, setCommentsState] = useState<CommentItem[]>(() => initialComments || []);
  const [canModerate, setCanModerate] = useState(!!initialCanModerate);
  const initialKey = `${scope}:${targetType}:${targetId}:${workId || ""}:${sortMode}:${includeUserRating ? "1" : "0"}`;
  const cacheKey = `comments:${initialKey}:${take || 100}`;
  const skippedInitialFetchRef = useRef(hasInitial);
  const initialKeyRef = useRef(initialKey);

  useEffect(() => {
    if (!hasInitial) return;
    seedClientResource<CommentsPayload>(
      cacheKey,
      {
        comments: initialComments || [],
        canModerate: !!initialCanModerate,
      },
      20_000
    );
  }, [cacheKey, hasInitial, initialCanModerate, initialComments]);

  const setComments = useCallback(
    (value: SetStateAction<CommentItem[]>) => {
      setCommentsState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        mutateClientResource<CommentsPayload>(
          cacheKey,
          (current) => ({
            comments: next,
            canModerate: current?.canModerate ?? canModerate,
          }),
          20_000
        );
        return next;
      });
    },
    [cacheKey, canModerate]
  );

  const refresh = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      setLoading(true);
      try {
        const data = await getOrFetchClientResource<CommentsPayload>(
          cacheKey,
          async () => {
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
            const json = await res.json().catch(() => ({} as any));
            if (!res.ok) {
              throw new Error(json?.error || "Gagal memuat comments");
            }
            return {
              comments: (json?.comments || []) as CommentItem[],
              canModerate: !!json?.canModerate,
            };
          },
          { ttlMs: 15_000, force }
        );

        setCanModerate(data.canModerate);
        setCommentsState(data.comments);
        setLoading(false);
      } catch (error: any) {
        onError?.(error?.message || "Gagal memuat comments");
        setLoading(false);
      }
    },
    [cacheKey, includeUserRating, onError, scope, sortMode, take, targetId, targetType, workId]
  );

  useEffect(() => {
    if (skippedInitialFetchRef.current && initialKeyRef.current === initialKey) {
      skippedInitialFetchRef.current = false;
      return;
    }
    refresh();
  }, [initialKey, refresh]);

  return { loading, comments, setComments, canModerate, refresh };
}
