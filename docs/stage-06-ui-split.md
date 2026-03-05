# Stage 6 — Pecah komponen UI “monster” (tanpa ubah UI/fitur)

Fokus stage ini: **memecah komponen React client yang terlalu besar** menjadi modul kecil + hooks,
untuk meningkatkan keterbacaan dan memudahkan refactor tahap berikutnya.

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

Catatan: **behavior & UI sengaja dijaga sama** (hanya pemecahan modul).
