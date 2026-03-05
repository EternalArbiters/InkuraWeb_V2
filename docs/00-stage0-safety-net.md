# Tahap 0 – Safety Net (sebelum refactor besar)

> Lihat index dokumen: `docs/README.md`

- Setiap perubahan wajib lewat *gate* otomatis (`verify`) + checklist manual regresi.

> Repo ZIP ini sudah mencakup Tahap 0: `apps/web/.env.example`, update `verify`, dan dokumen checklist.

---

## 1) Kunci baseline (Git)

Kalau kamu pakai Git, lakukan ini **sebelum** mulai refactor:

```bash
git checkout -b cleaned-stage0
# atau kalau sudah ada branch

git tag inkura-cleaned-stage0
```

Tujuannya: kapan pun ada bug besar, kamu bisa balik ke baseline dengan cepat.

---

## 2) Setup lokal cepat

### Install

```bash
npm install
```

### ENV

Copy contoh ENV:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Isi minimal:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `R2_ENDPOINT` (atau `R2_ACCOUNT_ID`)
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

---

## 3) Gate otomatis

Jalankan ini setiap sebelum/ sesudah perubahan besar:

```bash
npm run verify
```

`verify` akan menjalankan:
- Prisma schema validation + generate client
- Typecheck (tsc)
- Next.js production build

Opsional tapi disarankan (butuh DB terkoneksi):

```bash
npm run sanity:db
```

---

## 4) Checklist regresi manual (wajib sebelum merge)

Lihat: `docs/REGRESSION_CHECKLIST.md`

