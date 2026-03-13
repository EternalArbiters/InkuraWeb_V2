# Perf refactor stage 07 — hydration preload and dynamic cleanup

Stage 7 focuses on two things that still remaining after stage 6:

1. Reduce request additional after hydration for page detail work and reader.
2. Remove `force-dynamic` that redunand on page wrapper that not membutuhkannya secara eksplcontentt.

The principles that remain unchanged:
- do not remove features
- API route still kept
- interactive client state still works after the page is shown

## Perubahan main

### 1. Preload review in work detail

Before stage 7, `ReviewSection` always fetched to:
- `/api/works/[workId]/reviews`

after hydration, even though page work is already rendered on the server.

Now the `/w/[slug]` server page loads the initial review directly through the server service:
- `server/services/reviews/listWorkReviews.ts`

Lalu initial result is passed to:
- `app/components/work/ReviewSection.tsx`
- `app/components/work/reviews/useReviews.ts`

Dampak:
- page detail work no longer needs to trigger a request review additional when first opened
- refresh interactive after submit/edit/delete still uses the same API endpoint

### 2. Preload comments on work detail and reader

Before stage 7, `CommentSection` sethen fetch to `/api/comments` on mount.

Now the initial comment data is loaded on the server for:
- `/w/[slug]`
- `/w/[slug]/read/[chapterId]`
- `/w/[slug]/read/[chapterId]/comments`

Services used:
- `server/services/comments/fetchComments.ts`

The client hook can now receive initial seed data:
- `app/components/work/comments/useComments.ts`

Dampak:
- work detail no longer needs to trigger a request comment agregat on mount
- reader mobile/desktop no longer needs to trigger a request comment preview separate on mount
- the full chapter comments page can also render with initial server data
- aksi reply/edit/like/dislike still uses the same API endpoint

### 3. Reuse logic review API to service server

GET route review now uses service same with server page:
- `server/services/reviews/listWorkReviews.ts`
- `server/services/api/works/[workId]/reviews/route.ts`

Hasilnya:
- review gating and sorting logic are not duplicated
- the server page and API use the same data contract

### 4. Dynamic cleanup safe

`force-dynamic` was removed from page wrappers that do not need to force dynamic rendering explicitly:
- `app/admin/notify/page.tsx`
- `app/browse/latest-translations/page.tsx`
- `app/browse/new-originals/page.tsx`
- `app/browse/recent-updates/page.tsx`
- `app/browse/trending-comics/page.tsx`
- `app/browse/trending-novels/page.tsx`
- `app/work/[workId]/page.tsx`
- `app/read/comic/[workId]/[chapterId]/page.tsx`
- `app/read/novel/[workId]/[chapterId]/page.tsx`

Note:
- some routes will still become dynamic automatically if their child/service reads session or cookies
- the purpose of this change is removing pemaksaan that redunand, not to change auth/gating behavior

## Important changed files

- `apps/web/app/w/[slug]/page.tsx`
- `apps/web/app/w/[slug]/read/[chapterId]/page.tsx`
- `apps/web/app/w/[slug]/read/[chapterId]/comments/page.tsx`
- `apps/web/app/components/work/CommentSection.tsx`
- `apps/web/app/components/work/comments/useComments.ts`
- `apps/web/app/components/work/ReviewSection.tsx`
- `apps/web/app/components/work/reviews/useReviews.ts`
- `apps/web/server/services/comments/fetchComments.ts`
- `apps/web/server/services/reviews/listWorkReviews.ts`
- `apps/web/server/services/api/works/[workId]/reviews/route.ts`

## Expected effect

Stage 7 not especially menurunkan jumlah query DB total; what is reduced is:
- additional browser requests after hydration
- function invocation additional for fetch review/comment initial
- initial UI latency before reviews/comments appear

## Verification notes

What can be verified in this working environment:
- scanner baseline statis berjalan
- hotspot `force-dynamic` reduced
- page detail/reader already membawa seed data initial to komponen client

What still cannot be fully claimed in this environment:
- `npm run verify` end-to-end
- final typecheck if workspace dependencies/types are not fully installed
