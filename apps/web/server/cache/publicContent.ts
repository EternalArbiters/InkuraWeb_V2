import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";

export const PUBLIC_CONTENT_REVALIDATE = {
  home: 60,
  work: 300,
  chapter: 300,
  readingList: 300,
  profile: 300,
  searchShell: 900,
} as const;

export function publicHomeTag() {
  return "public:home";
}

export function publicWorksTag() {
  return "public:works";
}

export function publicWorkTag(slug: string) {
  return `public:work:${slug}`;
}

export function publicChapterTag(chapterId: string) {
  return `public:chapter:${chapterId}`;
}

export function publicReadingListsTag() {
  return "public:reading-lists";
}

export function publicProfilesTag() {
  return "public:profiles";
}

export function publicProfileTag(username: string) {
  return `public:profile:${username}`;
}

export function publicSearchShellTag() {
  return "public:search-shell";
}

export function publicReadingListTag(slug: string) {
  return `public:reading-list:${slug}`;
}

export function withCachedPublicData<T>(
  keyParts: string[],
  tags: string[],
  revalidateSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  return unstable_cache(loader, keyParts, { tags, revalidate: revalidateSeconds })();
}

export function revalidatePublicWork(slug: string | null | undefined) {
  revalidateTag(publicWorksTag());
  revalidateTag(publicHomeTag());
  if (slug) revalidateTag(publicWorkTag(slug));
}

export function revalidatePublicChapter(input: { chapterId?: string | null; workSlug?: string | null }) {
  revalidateTag(publicWorksTag());
  revalidateTag(publicHomeTag());
  if (input.workSlug) revalidateTag(publicWorkTag(input.workSlug));
  if (input.chapterId) revalidateTag(publicChapterTag(input.chapterId));
}

export function revalidatePublicReadingList(slug: string | null | undefined) {
  revalidateTag(publicReadingListsTag());
  if (slug) revalidateTag(publicReadingListTag(slug));
}

export function revalidatePublicProfile(username: string | null | undefined) {
  revalidateTag(publicProfilesTag());
  if (username) revalidateTag(publicProfileTag(username));
}
