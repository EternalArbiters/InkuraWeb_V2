# Regression Checklist (Manual) – Inkura

Checklist ini dipakai setiap kali kita refactor/rapihin repo supaya **fitur tidak hilang**.

Prinsip:
- Jangan hanya mengandalkan build sukses.
- Fokus ke *critical user journeys* (Auth → Browse → Read → Interact → Studio → Admin).

---

## 0) Persiapan

### A. Setup & DB

1. Pastikan ENV sudah terisi (`apps/web/.env.local`).
2. Init DB (akan reset + seed):

```bash
npm run db:init
```

3. Jalankan dev server:

```bash
npm run dev
```

Akses: `http://localhost:3000`

### B. Akun yang dipakai

Minimal siapkan 2 akun:

1) **Admin (seed default)**
- Email: `noelephgoddess.game@gmail.com`
- Password: `admin123`

2) **User biasa**
- Register lewat UI (email + password).

> Catatan: role ADMIN di-enforce berdasarkan email. Akun lain tidak akan jadi admin walau `role` di DB diubah manual.

---

## 1) Automated gate (wajib)

Dari root:

```bash
npm run verify
```

Opsional (butuh DB konek):

```bash
npm run sanity:db
```

PASS jika: tidak ada error pada lint/typecheck/build.

---

## 2) Auth & Account

Dengan **user biasa**:

1. Register (email/password) → harus sukses.
2. Login → harus masuk ke `/home`.
3. Logout → session hilang.
4. Login ulang.

Forgot password (opsional):
- Request reset.
- Jika `SHOW_RESET_TOKEN=1`, endpoint forgot-password menampilkan token/reset URL (dev).
- Confirm reset → password berubah → bisa login pakai password baru.

PASS jika: tidak ada redirect loop (khususnya di route protected: `/home`, `/library`, `/studio`).

---

## 3) Browse & Search (works listing)

Dengan **user biasa** (belum adultConfirmed):

1. Buka `/home` → list tampil (tidak blank/500).
2. Buka `/search`:
   - Filter genre/tags tampil.
   - Tri-state include/exclude bekerja.
   - Konten `isMature` tidak muncul.
   - Filter warning NSFW tidak bisa dipakai (atau tidak muncul).

Aktifkan `adultConfirmed`:
3. Buka `/settings/account` (atau halaman settings yang relevan).
4. Toggle `18+` (adultConfirmed) ON.
5. Kembali ke `/search`:
   - Work mature bisa muncul.
   - Warning tag filter bisa dipakai.

Aktifkan `deviantLoveConfirmed`:
6. Toggle deviant love ON (biasanya hanya muncul setelah adultConfirmed).
7. Kembali ke `/search`:
   - Filter deviant love muncul.

PASS jika: filter tidak menyebabkan 500 dan gating konsisten.

---

## 4) Work detail & reader

### A. Work detail
1. Klik salah satu work → `/w/[slug]`.
2. Data work tampil (title, cover, info, genres/tags).

### B. Reader
1. Masuk baca chapter: `/w/[slug]/read/[chapterId]`.
2. Prev/Next chapter jalan.
3. Kalau chapter/work punya warning tags: gate tampil dan bisa di-ack.

PASS jika: reader tidak blank dan assets (cover/pages) termuat.

---

## 5) Interaksi (like/bookmark/rating/review)

Dengan user biasa:

1. Like work → counter berubah.
2. Bookmark work → masuk ke `/library`.
3. Beri rating (mis. 4/5) → average/count ter-update.
4. Tulis review (jika UI ada) → muncul dan bisa di-vote.

PASS jika: tidak ada double-submit yang bikin error dan state konsisten setelah refresh.

---

## 6) Comments (thread, mention, pin, attachment)

Dengan user biasa:

1. Buat komentar di work.
2. Reply komentar (nested).
3. Like/dislike comment.
4. Mention `@username` (kalau fitur aktif) → harus resolve/notify.

Attachment (butuh R2):
5. Upload image/gif untuk comment (maks 3).
6. Pastikan attachment muncul setelah refresh.

PASS jika: comment tree tidak rusak, sorting tidak error, dan attachment valid.

---

## 7) Reading progress

Dengan user biasa:

1. Baca chapter sampai beberapa scroll.
2. Refresh atau keluar masuk.
3. Cek `/library` atau indikator progress → harus tersimpan.

PASS jika: progress tetap ada setelah reload.

---

## 8) Studio (creator flow)

Dengan user biasa:

1. Buka `/studio`.
2. Create Work:
   - Isi title, type (NOVEL/COMIC), metadata.
   - Upload cover.
3. Edit Work:
   - Update metadata.
   - Replace cover (kalau ada) → cover lama idealnya terhapus best-effort.

4. Create Chapter:
   - NOVEL: isi text.
   - COMIC: upload pages.

5. Publish work/chapter.

PASS jika: work/chapter tampil untuk user di browse & reader setelah publish.

---

## 9) Notifications

Skenario minimal:

1. User A follow/like/bookmark work.
2. Creator publish chapter baru.
3. User A harus dapat notification.

Komentar:
4. Comment di work → owner work dapat notif.
5. Reply comment → parent commenter dapat notif.

PASS jika: unread count berubah dan list notif tidak error.

---

## 10) Admin (taxonomy + moderation)

Dengan **admin seed**:

### A. Admin pages protected
1. Akses `/admin` dan halaman admin lain.
2. Pastikan user biasa **tidak** bisa masuk (redirect/forbidden).

### B. Taxonomy manager
1. Buka:
   - `/admin/taxonomy/genres`
   - `/admin/taxonomy/tags`
   - `/admin/taxonomy/warnings`
   - `/admin/taxonomy/deviant-love`
2. Add / Edit / Deactivate / Reactivate.
3. Reorder dan Save order.
4. Cek `/search` sebagai user biasa: perubahan taxonomy ter-propagate.

### C. Reports
1. User biasa report comment.
2. Admin buka queue report → report muncul.

PASS jika: admin actions tidak 500 dan perubahan kebaca user.

---

## Catatan troubleshooting cepat

- Build/lint fail setelah refactor: jalankan `npm run verify` dan perbaiki sebelum lanjut.
- Upload gagal: pastikan ENV R2 benar dan `R2_PUBLIC_BASE_URL` bisa diakses.
- Tidak bisa masuk admin: pastikan login memakai email admin yang di-enforce.

