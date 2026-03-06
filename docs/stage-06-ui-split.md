# Stage 6 — Pecah komponen UI “monster” (tanpa ubah UI/fitur)

Fokus stage ini: **memecah komponen React client yang terlalu besar** menjadi modul kecil + hooks,
untuk meningkatkan keterbacaan dan memudahkan refactor tahap berikutnya.

Prinsip:

- **Tidak mengubah behavior** (request API, response handling, className, dan urutan render dijaga).
- Memisah **stateful logic → hooks**.
- Memisah **render/UI → komponen presentational**.

## Perubahan utama

### CommentSection

Komponen `apps/web/app/components/work/CommentSection.tsx` sebelumnya berisi:

- definisi tipe komentar
- text parsing (||hidden||), URL auto-link
- fetch comments + sort + focus by query param
- composer + upload attachments
- render tree + actions (like/dislike/reply/edit/delete/pin/hide/report)

Sekarang dipecah menjadi folder:

`apps/web/app/components/work/comments/`

- `types.ts` — tipe data komentar (TargetType/SortMode/CommentItem/DecoratedComment)
- `utils.ts` — helper `normalizeSort`, `decorateTree`, `updateTree`, `removeFromTree`
- `textUtils.ts` — helper parsing hidden + URL normalize
- `CommentBody.tsx` — renderer body komentar (hidden inline + link)
- `CommentComposer.tsx` — UI composer (textarea + toolbar + attachments preview)
- `CommentCard.tsx` — UI kartu komentar + actions + reply/report (rekursif untuk replies)
- `CommentThread.tsx` — list root comments → `CommentCard`
- `useComments.ts` — hook fetch comments (scope/params/sort)
- `useCommentComposer.ts` — hook composer (text/files + submit + presign media)

### ReviewSection

Komponen `apps/web/app/components/work/ReviewSection.tsx` sebelumnya berisi:

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

Komponen `apps/web/app/components/DashboardNavbar.tsx` sebelumnya mencampur:

- theme toggle (dark mode)
- navigation progress bar
- mobile header auto-hide + tap handler
- desktop search bar + overlay search
- dropdown settings/category + profile

Sekarang dipecah menjadi folder:

`apps/web/app/components/dashboardNavbar/`

- `constants.ts` — konstanta nav/search/category
- `NavLink.tsx` — link aktif + prefetch=false (stabil dengan auth gating)
- `useThemeToggle.ts` — state & side-effect theme
- `useMobileHeaderVisibility.ts` — auto-hide header mobile + click handler
- `useNavigationProgress.ts` — progress bar saat navigasi
- `DesktopNavLinks.tsx` — list nav link utama
- `DesktopSearch.tsx` — search form desktop
- `DesktopActions.tsx` — icon group + dropdown settings/category + profile
- `SearchOverlay.tsx` — overlay search mobile/desktop
- `ProgressBar.tsx` — progress bar component

`DashboardNavbar.tsx` menjadi orchestrator yang lebih tipis.

### Studio Work Forms

#### Edit Work

`apps/web/app/studio/works/[workId]/edit/WorkEditForm.tsx` dipecah menjadi modul lokal:

`apps/web/app/studio/works/[workId]/edit/components/`

- `useMyWorksLite.ts` — fetch list "my works" untuk arc picker
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

Catatan: **behavior & UI sengaja dijaga sama** (hanya pemecahan modul).
