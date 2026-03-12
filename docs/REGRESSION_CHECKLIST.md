# Regression Checklist (Manual) – Inkura

Checklist this used setiap kali kita refactor/rapihin repo so that **features not hilang**.

Prinsip:
- Do not only mengandalkan build sukses.
- Fokus to *critical user journeys* (Auth → Browse → Read → Interact → Studio → Admin).

---

## 0) Persiapan

### A. Setup & DB

1. Pastikan ENV already tercontent (`apps/web/.env.local`).
2. Init DB (akan reset + seed):

```bash
npm run db:init
```

3. Jalankan dev server:

```bash
npm run dev
```

Akses: `http://localhost:3000`

### B. Akun used

Minimal siapkan 2 akun:

1) **Admin (seed default)**
- Email: `noelephgoddess.game@gmail.com`
- Password: `admin123`

2) **User biasa**
- Register through UI (email + password).

> Note: role ADMIN in-enforce berdasarkan email. Akun lain not akan become admin walau `role` in DB diubah manual.

---

## 1) Automated gate (required)

From the repo root:

```bash
npm run verify
```

Optional (butuh DB konek):

```bash
npm run sanity:db
```

PASS if: not there is error pada lint/typecheck/build.

---

## 2) Auth & Account

With **user biasa**:

1. Register (email/password) → must sukses.
2. Login → must enter to `/home`.
3. Logout → session hilang.
4. Login again.

Forgot password (optional):
- Request reset.
- Jika `SHOW_RESET_TOKEN=1`, endpoint forgot-password menampilkan token/reset URL (dev).
- Confirm reset → password berubah → can login use password new.

PASS if: not there is redirect loop (khususnya in route protected: `/home`, `/library`, `/studio`).

---

## 3) Browse & Search (works listing)

With **user biasa** (not yet adultConfirmed):

1. Buka `/home` → list tampil (not blank/500).
2. Buka `/search`:
   - Filter genre/tags tampil.
   - Tri-state include/exclude bekerja.
   - Konten `isMature` not appear.
   - Filter warning NSFW not can used (or not appear).

Aktifkan `adultConfirmed`:
3. Buka `/settings/account` (or page settings that are relevant).
4. Toggle `18+` (adultConfirmed) ON.
5. Back to `/search`:
   - Work mature can appear.
   - Warning tag filter can used.

Aktifkan `deviantLoveConfirmed`:
6. Toggle deviant love ON (biasanya only appear after adultConfirmed).
7. Back to `/search`:
   - Filter deviant love appear.

PASS if: filter not menyebabkan 500 and gating consistent.

---

## 4) Work detail & reader

### A. Work detail
1. Klik salah satu work → `/w/[slug]`.
2. Data work tampil (title, cover, info, genres/tags).

### B. Reader
1. Enter baca chapter: `/w/[slug]/read/[chapterId]`.
2. Prev/Next chapter jalan.
3. If chapter/work punya warning tags: gate tampil and can in-ack.

PASS if: reader not blank and assets (cover/pages) termuat.

---

## 5) Interaksi (like/bookmark/rating/review)

With user biasa:

1. Like work → counter berubah.
2. Bookmark work → enter to `/library`.
3. Beri rating (mis. 4/5) → average/count ter-update.
4. Write review (if UI there is) → appear and can in-vote.

PASS if: not there is double-submit that bikin error and state consistent after refresh.

---

## 6) Comments (thread, mention, pin, attachment)

With user biasa:

1. Buat comments in work.
2. Reply comments (nested).
3. Like/dislike comment.
4. Mention `@username` (if features active) → must resolve/notify.

Attachment (butuh R2):
5. Upload image/gif for comment (maks 3).
6. Pastikan attachment appear after refresh.

PASS if: comment tree not rusak, sorting not error, and attachment valid.

---

## 7) Reading progress

With user biasa:

1. Baca chapter sampai several scroll.
2. Refresh or exit enter.
3. Cek `/library` or indikator progress → must tersimpan.

PASS if: progress still there is after reload.

---

## 8) Studio (creator flow)

With user biasa:

1. Buka `/studio`.
2. Create Work:
   - Content title, type (NOVEL/COMIC), metadata.
   - Upload cover.
3. Edit Work:
   - Update metadata.
   - Replace cover (if there is) → cover old idealnya terhapus best-effort.

4. Create Chapter:
   - NOVEL: content text.
   - COMIC: upload pages.

5. Publish work/chapter.

PASS if: work/chapter tampil for user in browse & reader after publish.

---

## 9) Notifications

Skenario minimal:

1. User A follow/like/bookmark work.
2. Creator publish chapter new.
3. User A must dapat notification.

Comments:
4. Comment in work → owner work dapat notif.
5. Reply comment → parent commenter dapat notif.

PASS if: unread count berubah and list notif not error.

---

## 10) Admin (taxonomy + moderation)

With **admin seed**:

### A. Admin pages protected
1. Akses `/admin` and page admin lain.
2. Pastikan user biasa **not** can enter (redirect/forbidden).

### B. Taxonomy manager
1. Buka:
   - `/admin/taxonomy/genres`
   - `/admin/taxonomy/tags`
   - `/admin/taxonomy/warnings`
   - `/admin/taxonomy/deviant-love`
2. Add / Edit / Deactivate / Reactivate.
3. Reorder and Save order.
4. Cek `/search` sebagai user biasa: perubahan taxonomy ter-propagate.

### C. Reports
1. User biasa report comment.
2. Admin buka queue report → report appear.

PASS if: admin actions not 500 and perubahan kebaca user.

---

## Catatan troubleshooting cepat

- Build/lint fail after refactor: jalankan `npm run verify` and perbaiki before continue.
- Upload failed: make sure ENV R2 benar and `R2_PUBLIC_BASE_URL` can diakses.
- Tidak can enter admin: make sure login memakai email admin that in-enforce.

