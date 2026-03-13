# Inkura V15 – Sanity Checklist (Regression Guard)


> Note (cleaned repo): the regression checklist that is now the **primary source** is in `../../docs/REGRESSION_CHECKLIST.md`.
> This document still dcontentmpan as note historical khusus V15.

Goal: ensuring **features user not rusak** when we adding **Admin Taxonomy Panel**.

> Prinsip: V15 that *additive*. Haoldn user & public API already there is **not may lost / berubah kontrak**.

---

## A. Quick Commands (Automated Guards)

From root repo:

```bash
npm run verify
```

Or from `apps/web`:

```bash
npm run verify
```

Content `verify` on snapshot final this:
- `prisma validate`
- `prisma generate`
- `tsc --noEmit`
- `vitest run`
- `next build`

DB schema check (optional, but recommended):

```bash
npm run sanity:db
```

---

## B. Manual Sanity – User Flow (Required)

Login **regular user** (not admin):

1. **Home**
   - Buka `/home`
   - Trending / list tampil (not blank/500)

2. **Search + Advanced Filter**
   - Buka `/search`
   - Genre picker appear
   - Toggle tri-state bekerja (include/exclude)
   - If `adultConfirmed` OFF: warning NSFW not appear
   - If `deviantLoveConfirmed` OFF: deviant love filter not appear

3. **Work Detail + Reader**
   - Buka salah satu `/w/[slug]`
   - Enter read chapter `/w/[slug]/read/[chapterId]`
   - Prev/next jalan
   - ContentWarningsGate appear sesuai kondcontent (if there is)

4. **Studio**
   - Buka `/studio`
   - Create work `/studio/new`
   - Edit work & tambah chapter still can

5. **Settings**
   - Buka `/settings/account`
   - Toggle adult/deviant love still jalan
   - Block list (genre/warning/deviant) still tampil

**PASS if:** not there is page user that 404 / redirect loop / blank / 500.

---

## C. Manual Sanity – Admin Flow (New)

Login **admin**:

1. **Admin Taxonomy Pages**
   - Buka `/admin/taxonomy/genres`
   - Can Add / Edit / Deactivate / Reactivate
   - Reorder: change order → klik **Save order**

2. **Propagation to User UI**
   - Setelah admin change (mis. deactivate genre), refresh `/search`
   - Genre that **lost from list** user

3. **Audit Log (DB level)**
   - Jalankan `npm run sanity:db` (must increased `adminAuditLogs` after aksi admin)

**PASS if:** admin CRUD jalan and perubahan kebaca in user UI.

---

## D. Common Failure Modes (Cepat check)

- **Seed error `Unknown argument isSystem`**
  - Jalankan `npx prisma generate` then `npm run db:seed`.
  - Di V15 script `db:seed` already automatic generate.

- **Taxonomy berubah balik after admin deactivate**
  - Pastikan logic `ensure catalog` not men-`reactivate` record already there is.

- **Cache not to-refresh**
  - Pastikan admin mutation calls `revalidateTag('taxonomy')`.
  - Pastikan public endpoints fetches from cached getter bertag `taxonomy`.
