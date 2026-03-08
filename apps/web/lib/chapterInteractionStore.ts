import "client-only";

export type ChapterInteractionState = {
  liked?: boolean;
  likeCount?: number;
};

const store = new Map<string, ChapterInteractionState>();
const listeners = new Map<string, Set<() => void>>();

function emit(chapterId: string) {
  listeners.get(chapterId)?.forEach((listener) => listener());
}

export function readChapterInteraction(chapterId: string): ChapterInteractionState {
  return store.get(chapterId) || {};
}

export function seedChapterInteraction(chapterId: string, patch: ChapterInteractionState) {
  const current = readChapterInteraction(chapterId);
  store.set(chapterId, { ...current, ...patch });
  emit(chapterId);
}

export function updateChapterInteraction(chapterId: string, updater: (current: ChapterInteractionState) => ChapterInteractionState) {
  const current = readChapterInteraction(chapterId);
  store.set(chapterId, updater(current));
  emit(chapterId);
}

export function subscribeChapterInteraction(chapterId: string, listener: () => void) {
  const bucket = listeners.get(chapterId) || new Set();
  bucket.add(listener);
  listeners.set(chapterId, bucket);
  return () => {
    const next = listeners.get(chapterId);
    if (!next) return;
    next.delete(listener);
    if (!next.size) listeners.delete(chapterId);
  };
}
