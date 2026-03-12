# Tahap 0 – Safety Net (before refactor besar)

> Lihat index document: `README.md`

- Setiap perubahan required through *gate* otomatis (`verify`) + checklist manual regresi.

> Repo ZIP this already mencakup Tahap 0: `apps/web/.env.example`, update `verify`, and document checklist.

---

## 1) Kunci baseline (Git)

If kamu use Git, lakukan this **before** mulai refactor:

```bash
git checkout -b cleaned-stage0
# or if a branch already exists

git tag inkura-cleaned-stage0
```

Tujuannya: kapan pun there is bug besar, kamu can balik to baseline with cepat.

---

## 2) Setup local cepat

### Install

```bash
npm install
```

### ENV

Copy example ENV:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Minimum contents:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `R2_ENDPOINT` (or `R2_ACCOUNT_ID`)
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

---

## 3) Gate otomatis

Jalankan this setiap before/ sealready perubahan besar:

```bash
npm run verify
```

`verify` pada snapshot final this akan menjalankan:
- Prisma schema validation + generate client
- Typecheck (tsc)
- Unit tests (Vitest)
- Next.js production build

For baseline hotspot performa statis before mulai refactor, jalankan juga:

```bash
npm run refactor:stage0
```

Optional tapi disarankan (butuh DB terconnection):

```bash
npm run sanity:db
```

---

## 4) Checklist regresi manual (required before merge)

Lihat: `REGRESSION_CHECKLIST.md`

