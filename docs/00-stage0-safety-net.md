# Stage 0 – Safety Net (before refactor large)

> See the document index: `README.md`

- Every change is required to go through the automatic *gate* (`verify`) plus the manual regression checklist.

> Repo ZIP this already mencakup Stage 0: `apps/web/.env.example`, update `verify`, and document checklist.

---

## 1) Kunci baseline (Git)

If you use Git, lakukan this **before** mulai refactor:

```bash
git checkout -b cleaned-stage0
# or if a branch already exists

git tag inkura-cleaned-stage0
```

Tujuannya: when pun there is bug large, you can balik to baseline with cepat.

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

## 3) Gate automatic

Jalankan this each before/ sealready major changes:

```bash
npm run verify
```

`verify` on snapshot final this will menjalankan:
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

## 4) Checklist regression manual (required before merge)

See: `REGRESSION_CHECKLIST.md`

