# Database reset & seeding

Dokumen ini menjelaskan cara menangani database lokal untuk repo Inkura cleaned.

## Prinsip paling penting

Perintah berikut **hanya aman untuk lokal / disposable DB**:

```bash
npm run db:init
npm --workspace apps/web run db:reset
```

Keduanya bersifat destruktif terhadap data pada database yang sedang ditunjuk oleh env.

## Alur paling aman untuk lokal dari nol

### 1) Siapkan env

```bash
cp apps/web/.env.example apps/web/.env.local
```

Pastikan `DATABASE_URL` dan `DIRECT_URL` menunjuk database lokal/dev yang memang boleh direset.

### 2) Reset + seed

```bash
npm run db:init
```

Di `apps/web`, script ini setara dengan:

```bash
npm run db:generate
npm run db:reset
npm run db:seed
```

### 3) Sanity check

```bash
npm run sanity:db
```

Sanity check akan memastikan Prisma bisa connect dan schema penting tersedia.

## Arti script database yang tersedia

Dari root repo, script utama yang relevan adalah:

### `npm run db:init`

- generate Prisma Client
- reset schema lokal
- seed data awal

Cocok dipakai ketika baru clone repo atau ingin mengulang dari nol.

### `npm --workspace apps/web run db:reset`

Implementasi saat ini:

```bash
prisma db push --force-reset
```

Artinya:

- schema akan di-push sesuai `schema.prisma`
- database akan direset total
- ini bukan perintah untuk production

### `npm --workspace apps/web run db:seed`

- generate Prisma Client
- menjalankan `prisma/seed.ts`

Seed saat ini membuat data dasar seperti:

- admin default
- taxonomy sistem
- sample works/chapters/data awal yang diperlukan seed

### `npm run sanity:db`

Dipakai untuk memverifikasi koneksi DB dan keberadaan bagian schema penting setelah reset/migration.

## Kredensial seed lokal

Seed default membuat akun admin berikut:

- Email: `noelephgoddess.game@gmail.com`
- Password: `admin123`

Role admin di repo ini dikaitkan dengan email tersebut. Untuk environment publik, sebaiknya data ini disesuaikan lewat proses seed/ops yang lebih aman.

## Perintah Prisma lain yang relevan

Dari `apps/web`:

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate
npm run db:push
npm run db:migrate:deploy
```

Kapan dipakai:

- `prisma:validate` → memastikan schema valid
- `prisma:generate` → regenerate Prisma Client
- `prisma:migrate` → membuat/menjalankan migration di lokal saat kamu memang sedang mengubah schema
- `db:push` → push schema ke DB tanpa migration file, cocok untuk eksperimen lokal tertentu
- `db:migrate:deploy` → menjalankan migration yang sudah ada, ini yang relevan untuk deploy/production

## Kapan memakai migration deploy, bukan reset

Untuk shared environment, staging, atau production:

- **jangan** pakai `db:init`
- **jangan** pakai `db:reset`
- pakai `db:migrate:deploy` melalui pipeline deploy

Di repo ini, Vercel `vercel-build` sudah menangani `prisma migrate deploy` sesuai environment rules.

## Taxonomy helpers

Repo juga punya helper yang kadang berguna saat kerja dengan taxonomy:

```bash
npm run db:taxonomy-alpha
npm --workspace apps/web run db:cleanup-taxonomy
```

Gunakan hanya bila konteks perubahannya memang terkait taxonomy.

## Recovery checklist kalau DB terasa aneh

- jalankan `npm run sanity:db`
- pastikan `DATABASE_URL` dan `DIRECT_URL` tidak tertukar
- bila lokal boleh dihapus, jalankan ulang `npm run db:init`
- kalau masalah muncul setelah ubah schema, regenerate client dengan `npm --workspace apps/web run prisma:generate`
- untuk shared env, jangan improvisasi reset; cek migration yang sudah ter-apply
