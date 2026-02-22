# Inkura V15 – Sanity Checklist (Regression Guard)

Tujuan: memastikan **fitur user tidak rusak** saat kita menambahkan **Admin Taxonomy Panel**.

> Prinsip: V15 itu *additive*. Halaman user & public API yang sudah ada **tidak boleh hilang / berubah kontrak**.

---

## A. Quick Commands (Automated Guards)

Dari root repo:

```bash
npm run verify
```

Atau dari `apps/web`:

```bash
npm run verify
```

Isi `verify`:
- `prisma validate`
- `prisma generate`
- `tsc --noEmit`
- `next build`

DB schema check (opsional, but recommended):

```bash
npm run sanity:db
```

---

## B. Manual Sanity – User Flow (Wajib)

Login **user biasa** (bukan admin):

1. **Home**
   - Buka `/home`
   - Trending / list tampil (tidak blank/500)

2. **Search + Advanced Filter**
   - Buka `/search`
   - Genre picker muncul
   - Toggle tri-state bekerja (include/exclude)
   - Jika `adultConfirmed` OFF: warning NSFW tidak muncul
   - Jika `deviantLoveConfirmed` OFF: deviant love filter tidak muncul

3. **Work Detail + Reader**
   - Buka salah satu `/w/[slug]`
   - Masuk read chapter `/w/[slug]/read/[chapterId]`
   - Prev/next jalan
   - ContentWarningsGate muncul sesuai kondisi (kalau ada)

4. **Studio**
   - Buka `/studio`
   - Create work `/studio/new`
   - Edit work & tambah chapter tetap bisa

5. **Settings**
   - Buka `/settings/account`
   - Toggle adult/deviant love tetap jalan
   - Block list (genre/warning/deviant) tetap tampil

**PASS jika:** tidak ada halaman user yang 404 / redirect loop / blank / 500.

---

## C. Manual Sanity – Admin Flow (Baru)

Login **admin**:

1. **Admin Taxonomy Pages**
   - Buka `/admin/taxonomy/genres`
   - Bisa Add / Edit / Deactivate / Reactivate
   - Reorder: ubah urutan → klik **Save order**

2. **Propagation ke User UI**
   - Setelah admin change (mis. deactivate genre), refresh `/search`
   - Genre tersebut **hilang dari list** user

3. **Audit Log (DB level)**
   - Jalankan `npm run sanity:db` (harus naik `adminAuditLogs` setelah aksi admin)

**PASS jika:** admin CRUD jalan dan perubahan kebaca di user UI.

---

## D. Common Failure Modes (Cepat cek)

- **Seed error `Unknown argument isSystem`**
  - Jalankan `npx prisma generate` lalu `npm run db:seed`.
  - Di V15 script `db:seed` sudah otomatis generate.

- **Taxonomy berubah balik setelah admin nonaktifkan**
  - Pastikan logic `ensure catalog` tidak men-`reactivate` record yang sudah ada.

- **Cache tidak ke-refresh**
  - Pastikan admin mutation memanggil `revalidateTag('taxonomy')`.
  - Pastikan public endpoints mengambil dari cached getter bertag `taxonomy`.
