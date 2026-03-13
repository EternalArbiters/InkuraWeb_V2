# Database reset & seeding

This document explain cara menangani database local for repo Inkura cleaned.

## Prinsip most penting

Perintah following **only safe for local / disposable DB**:

```bash
npm run db:init
npm --workspace apps/web run db:reset
```

Keduanya bersifat destruktif terhadap data on database that seandg ditunjuk oleh env.

## Alur safest for local from scratch

### 1) Siapkan env

```bash
cp apps/web/.env.example apps/web/.env.local
```

Pastikan `DATABASE_URL` and `DIRECT_URL` point to database local/dev that memang may be reset.

### 2) Reset + seed

```bash
npm run db:init
```

Di `apps/web`, script this equivalent to:

```bash
npm run db:generate
npm run db:reset
npm run db:seed
```

### 3) Sanity check

```bash
npm run sanity:db
```

Sanity check will ensure Prisma can connect and schema penting tersedia.

## Arti script database that tersedia

From root repo, script main that are relevant is:

### `npm run db:init`

- generate Prisma Client
- reset schema local
- seed data initial

Suitable used when just cloned the repo or want to start over from scratch.

### `npm --workspace apps/web run db:reset`

Implementasi currently:

```bash
prisma db push --force-reset
```

Artinya:

- schema will in-push sesuai `schema.prisma`
- the database will be reset completely
- this is not a production command

### `npm --workspace apps/web run db:seed`

- generate Prisma Client
- menjalankan `prisma/seed.ts`

Seed currently creates base data such as:

- admin default
- taxonomy sistem
- sample works/chapters/initial data required by the seed

### `npm run sanity:db`

Diuse to verify connection DB and the presence of important schema sections after reset/migration.

## Kredensial seed local

Seed default make akun admin following:

- Email: `noelephgoddess.game@gmail.com`
- Password: `admin123`

Role admin in repo this dikaitkan with email that. For public environments, should data this adjusted through proses seed/ops that safer.

## Perintah Prisma lain that are relevant

From `apps/web`:

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate
npm run db:push
npm run db:migrate:deploy
```

When to use it:

- `prisma:validate` → ensuring schema valid
- `prisma:generate` → regenerate Prisma Client
- `prisma:migrate` → make/menjalankan migration in local when you memang seandg mengubah schema
- `db:push` → push schema to DB without migration file, match for specific local experiments
- `db:migrate:deploy` → menjalankan migration already there is, this that are relevant for deploy/production

## When to use migration deploy instead of reset

For shared environments, staging, or production:

- **do not** use `db:init`
- **do not** use `db:reset`
- use `db:migrate:deploy` metheni pipeline deploy

In this repo, Vercel `vercel-build` already menangani `prisma migrate deploy` sesuai environment rules.

## Taxonomy helpers

Repo juga punya helper that sometimes useful when work with taxonomy:

```bash
npm run db:taxonomy-alpha
npm --workspace apps/web run db:cleanup-taxonomy
```

Gunakan only when the change context memang related taxonomy.

## Recovery checklist if DB feels odd

- jalankan `npm run sanity:db`
- make sure `DATABASE_URL` and `DIRECT_URL` are not swapped
- if local may dihapus, jalankan again `npm run db:init`
- if the problem appears after change schema, regenerate client with `npm --workspace apps/web run prisma:generate`
- for shared environments, do not improvise a reset; check which migrations have already been applied
