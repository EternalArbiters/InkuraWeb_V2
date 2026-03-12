# Stage 6 — Pecah komponen UI “monster” (without change UI/features)

Fokus stage this: **memecah komponen React client that terthen besar** menjadi modul kecil + hooks,
for meningkatkan keterbacaan and memudahkan refactor stage berikutnya.

Prinsip:

- **Tidak mengubah behavior** (request API, response handling, className, and urutan render dijaga).
- Memisah **stateful logic → hooks**.
- Memisah **render/UI → komponen presentational**.

## Perubahan main

### CommentSection

Komponen `apps/web/app/components/work/CommentSection.tsx` beforenya bercontent:

- defincontent tipe comments
- text parsing (||hidden||), URL auto-link
- fetch comments + sort + focus by query param
- composer + upload attachments
- render tree + actions (like/dislike/reply/edit/delete/pin/hide/report)

Sekarang dipecah menjadi folder:

`apps/web/app/components/work/comments/`

- `types.ts` — tipe data comments (TargetType/SortMode/CommentItem/DecoratedComment)
- `utils.ts` — helper `normalizeSort`, `decorateTree`, `updateTree`, `removeFromTree`
- `textUtils.ts` — helper parsing hidden + URL normalize
- `CommentBody.tsx` — renderer body comments (hidden inline + link)
- `CommentComposer.tsx` — UI composer (textarea + toolbar + attachments preview)
- `CommentCard.tsx` — UI kartu comments + actions + reply/report (rekursif for replies)
- `CommentThread.tsx` — list root comments → `CommentCard`
- `useComments.ts` — hook fetch comments (scope/params/sort)
- `useCommentComposer.ts` — hook composer (text/files + submit + presign media)

### ReviewSection

Komponen `apps/web/app/components/work/ReviewSection.tsx` beforenya bercontent:

- tipe data review
- renderer stars
- fetch + sort + toggle helpful
- modal composer (rating, spoiler, title/body)

Sekarang dipecah menjadi folder:

`apps/web/app/components/work/reviews/`

- `types.ts` — tipe `ReviewItem`, `ReviewSort`
- `utils.ts` — helper display name
- `Stars.tsx` — renderer rating bintang
- `ReviewCard.tsx` — presentational card (header + spoiler gating + helpful/edit/delete)
- `ReviewModal.tsx` — modal composer (controlled)
- `useReviews.ts` — hook data & actions (fetch/sort/submit/delete/helpful)

### DashboardNavbar

Komponen `apps/web/app/components/DashboardNavbar.tsx` beforenya mencampur:

- theme toggle (dark mode)
- navigation progress bar
- mobile header auto-hide + tap handler
- desktop search bar + overlay search
- dropdown settings/category + profile

Sekarang dipecah menjadi folder:

`apps/web/app/components/dashboardNavbar/`

- `constants.ts` — konstanta nav/search/category
- `NavLink.tsx` — link active + prefetch=false (stabil with auth gating)
- `useThemeToggle.ts` — state & side-effect theme
- `useMobileHeaderVcontentbility.ts` — auto-hide header mobile + click handler
- `useNavigationProgress.ts` — progress bar saat navigasi
- `DesktopNavLinks.tsx` — list nav link main
- `DesktopSearch.tsx` — search form desktop
- `DesktopActions.tsx` — icon group + dropdown settings/category + profile
- `SearchOverlay.tsx` — overlay search mobile/desktop
- `ProgressBar.tsx` — progress bar component

`DashboardNavbar.tsx` menjadi orchestrator that more tipis.

### Studio Work Forms

#### Edit Work

`apps/web/app/studio/works/[workId]/edit/WorkEditForm.tsx` dipecah menjadi modul local:

`apps/web/app/studio/works/[workId]/edit/components/`

- `useMyWorksLite.ts` — fetch list "my works" for arc picker
- `WorkPublishTypeCard.tsx`
- `CreditsSourceFields.tsx`
- `WorkArcFields.tsx`
- `WorkBasicsFields.tsx`
- `WorkSummaryField.tsx`
- `WorkCoverCard.tsx`
- `WorkTaxonomyFields.tsx`
- `SubmitRow.tsx`

#### New Work

`apps/web/app/studio/new/NewWorkForm.tsx` dipecah menjadi:

`apps/web/app/studio/new/components/`

- `CoverCard.tsx`
- `PublishTypeCard.tsx`
- `WorkBasicsCard.tsx`
- `DeviantLoveCard.tsx`
- `SubmitRow.tsx`

### Comic Pages Manager

`apps/web/app/studio/works/[workId]/chapters/[chapterId]/pages/ComicPagesManager.tsx` dipecah menjadi:

`apps/web/app/studio/works/[workId]/chapters/[chapterId]/pages/components/`

- `useComicPagesManager.ts` — hook upload/replace/set cover/clear/delete
- `UploadPagesCard.tsx` — UI upload + toggle replace
- `ChapterCoverCard.tsx` — UI thumbnail cover
- `PagesGrid.tsx` — grid pages + actions

Note: **behavior & UI intentionally dijaga sama** (only pemecahan modul).
