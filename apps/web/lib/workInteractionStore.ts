import "client-only";

export type WorkInteractionState = {
  liked?: boolean;
  likeCount?: number;
  bookmarked?: boolean;
  myRating?: number | null;
  ratingAvg?: number;
  ratingCount?: number;
};

const store = new Map<string, WorkInteractionState>();
const listeners = new Map<string, Set<() => void>>();

function emit(workId: string) {
  listeners.get(workId)?.forEach((listener) => listener());
}

export function readWorkInteraction(workId: string): WorkInteractionState {
  return store.get(workId) || {};
}

export function seedWorkInteraction(workId: string, patch: WorkInteractionState) {
  const current = readWorkInteraction(workId);
  store.set(workId, { ...current, ...patch });
  emit(workId);
}

export function updateWorkInteraction(workId: string, updater: (current: WorkInteractionState) => WorkInteractionState) {
  const current = readWorkInteraction(workId);
  store.set(workId, updater(current));
  emit(workId);
}

export function subscribeWorkInteraction(workId: string, listener: () => void) {
  const bucket = listeners.get(workId) || new Set();
  bucket.add(listener);
  listeners.set(workId, bucket);
  return () => {
    const next = listeners.get(workId);
    if (!next) return;
    next.delete(listener);
    if (!next.size) listeners.delete(workId);
  };
}
