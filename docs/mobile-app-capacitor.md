# Hohoo Android App (Capacitor) — Runbook

Versi aplikasi Android dari Hohoo. Bentuknya **APK** yang dibagikan langsung
(bukan Play Store), isinya Capacitor WebView yang me-load deployment khusus app
di Vercel.

> Dokumen ini **referensi** (arsitektur, daftar env, batasan, troubleshooting).
> Kalau ini pertama kalinya bikin APK, mulai dari panduan langkah-per-langkah di
> [`mobile-app-tutorial.md`](mobile-app-tutorial.md) dan pakai dokumen ini
> sebagai rujukan saat butuh detail.

## Arsitektur: tiga deployment, satu codebase

| | Project 1 | Project 2 | **Project 3 (baru)** |
|---|---|---|---|
| Domain | `inkura.id` | `koleksiatmint.vercel.app` | bebas, mis. `inkura-app.vercel.app` |
| Status | **paused, jangan disentuh** | private link | backend APK |
| Env penanda | — | `PRIVATE_MODE=true` | `APP_MODE=true` + `APP_ACCESS_TOKEN` |
| Yang bisa masuk | — | ADMIN / SPECIAL_USER | **hanya APK Hohoo** |
| Isi yang terlihat | — | katalog + Koleksi Admin | katalog publik normal |

Project 3 menjalankan Hohoo seperti versi publik dulu (registrasi terbuka,
semua karya published kelihatan), tapi `middleware.ts` menjawab **404 untuk
semua request yang bukan dari APK**. Jadi tidak ada web yang bisa dijelajahi,
dishare, atau diindeks dari browser.

Cara APK dikenali: WebView-nya menambahkan penanda ke User-Agent —
`InkuraApp/<versi> (key=<APP_ACCESS_TOKEN>)` — dan middleware membandingkan
token itu dengan env `APP_ACCESS_TOKEN`.

> **Token ini obfuscation, bukan autentikasi.** Siapa pun yang meng-unzip APK
> bisa membacanya, dan User-Agent itu juga terkirim ke pihak ketiga yang
> dihubungi WebView (R2, OAuth). Fungsinya menjauhkan deployment dari browser
> dan crawler, bukan mengamankan data. Pengamanan asli tetap di NextAuth session
> + authorization per route, sama seperti sekarang. Kalau token bocor: ganti
> `APP_ACCESS_TOKEN` di Vercel, rebuild APK, bagikan ulang.

Gate ini **fail closed**: `APP_MODE=true` tanpa `APP_ACCESS_TOKEN` memblokir
semuanya, bukan malah membuka situs ke internet.

---

## Langkah 1 — Bikin token

Jalankan di terminal (atau pakai generator acak apa pun, minimal 24 byte):

    node -e "console.log(require(\"crypto\").randomBytes(24).toString(\"base64url\"))"

Simpan hasilnya. Nilai yang sama dipakai di dua tempat: env Vercel Project 3 dan
`apps/mobile/app.config.json`.

## Langkah 2 — Deploy Project 3 di Vercel

Import repo yang sama jadi project Vercel baru. Env-nya sama seperti Project 2,
**kecuali**:

| Env | Nilai di Project 3 |
|---|---|
| `APP_MODE` | `true` |
| `APP_ACCESS_TOKEN` | token dari Langkah 1 |
| `PRIVATE_MODE` | **jangan diset** — ini yang bikin katalog terbuka normal |
| `NEXTAUTH_URL` | URL Project 3 |
| `NEXT_PUBLIC_SITE_URL` | URL Project 3 |
| `CRON_SECRET` | **jangan diset** — lihat catatan cron di bawah |
| `DATABASE_URL` / `DIRECT_URL` | sama dengan Project 2 (DB dipakai bareng) |
| `R2_*`, `NEXTAUTH_SECRET`, `RESEND_*` | sama dengan Project 2 |

Tiga hal yang perlu disadari sebelum deploy:

1. **DB dipakai bareng.** Project 2 dan 3 nembak Neon yang sama, jadi karya yang
   diupload teman dari app langsung muncul juga di private link. Itu memang yang
   diinginkan (satu komunitas), tapi artinya satu DB, satu bucket R2, satu set
   user.
2. **Cron jangan dobel.** `vercel.json` di repo mendaftarkan cron rebuild
   leaderboard mingguan, jadi Project 3 ikut punya jadwal itu. Dengan
   `CRON_SECRET` dibiarkan kosong, route-nya balas 401 dan jadwal itu jadi
   no-op — leaderboard tetap dibangun sekali saja oleh Project 2.
3. **Migrasi.** `scripts/vercel-build.js` menjalankan `prisma migrate deploy` di
   production. Selama Project 3 dideploy dari commit yang sama dengan Project 2,
   ini no-op. Jangan deploy Project 3 dari branch yang punya migrasi baru yang
   belum dipakai Project 2.
4. **CORS bucket R2 harus ditambah.** Upload cover / halaman komik jalan dengan
   `fetch` PUT langsung dari browser ke presigned URL R2 (`lib/r2UploadClient.ts`),
   jadi itu request lintas origin. Tambahkan origin Project 3 ke CORS policy
   bucket di dashboard Cloudflare R2 (Settings → CORS Policy), kalau tidak semua
   upload dari app gagal dengan error CORS:

   ```json
   [
     {
       "AllowedOrigins": ["https://inkura-app.vercel.app"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["content-type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Gabungkan dengan entry origin yang sudah ada, jangan ditimpa.

Catatan: menambah Project 3 ke repo yang sama berarti setiap push juga memicu
build di Project 3 (dan Project 2, kalau auto-deploy-nya masih hidup). Project 1
tetap tidak tersentuh selama project itu dibiarkan paused.

Kalau OAuth mau tetap dipakai dari browser: tambahkan
`https://<project-3>/api/auth/callback/google` dan `.../discord` di console
Google/Discord. Di dalam app sendiri tombol Google disembunyikan — lihat
Batasan.

## Langkah 3 — Siapkan mesin lokal

Yang harus ada:

- **JDK 21** (dibutuhkan Capacitor 7)
- **Android Studio** terbaru + Android SDK (Platform 35) + Platform-Tools
- `ANDROID_HOME` mengarah ke folder SDK, dan `platform-tools` masuk PATH

```bash
cd apps/mobile
npm install
cp app.config.example.json app.config.json
```

Folder `apps/mobile` **sengaja di luar npm workspaces** supaya dependency
Capacitor tidak ikut masuk ke lockfile `apps/web` dan tidak mengganggu build
Vercel. Jadi `npm install`-nya dijalankan dari dalam folder itu.

Isi `app.config.json`:

```json
{
  "url": "https://inkura-app.vercel.app",
  "key": "<token dari Langkah 1>",
  "version": "1.0",
  "appId": "id.hohoo.app",
  "appName": "Hohoo"
}
```

File ini gitignored karena berisi token. `capacitor.config.ts` akan gagal dengan
pesan jelas kalau `url` atau `key` kosong.

## Langkah 4 — Generate project Android

```bash
npm run android:add
npm run sync
```

Folder `android/` gitignored karena bisa dibuat ulang kapan saja dari dua
perintah itu. Branding-nya ada di `apps/mobile/assets/`, bukan di dalamnya.

## Langkah 5 — Ikon dan splash screen

Taruh dua file di `apps/mobile/assets/`:

- `icon.png` — 1024x1024, hindari transparansi di tepi
- `splash.png` — 2732x2732, logo di tengah, latar `#0c1538`

```bash
npm run icons
npm run sync
```

## Langkah 6 — Build APK buat dicoba sendiri

```bash
npm run apk:debug
```

Hasilnya ada di
`apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Pasang ke HP
lewat kabel:

```bash
adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Yang harus terlihat: splash gelap, lalu langsung halaman Hohoo. Kalau yang
muncul halaman putih atau tulisan `404 — Not Found`, berarti token APK tidak
sama dengan `APP_ACCESS_TOKEN` (lihat Troubleshooting).

## Langkah 7 — Build APK buat dibagikan

Debug APK bisa dipasang, tapi untuk dibagikan lebih baik release yang
ditandatangani sendiri. Keystore dibuat sekali, dipakai terus:

```bash
keytool -genkey -v -keystore inkura-release.keystore -alias inkura \
  -keyalg RSA -keysize 2048 -validity 10000
```

Simpan keystore dan passwordnya di tempat aman, **jangan commit** (sudah masuk
`.gitignore`). Kalau hilang, APK update tidak bisa dipasang menimpa yang lama —
teman-temanmu harus uninstall dulu.

Cara paling gampang untuk beberapa kali rilis: Android Studio → Build →
Generate Signed Bundle / APK → pilih APK → tunjuk keystore itu. Kalau mau lewat
CLI, daftarkan `signingConfigs` di `android/app/build.gradle` yang membaca
`android/keystore.properties` (file itu juga sudah gitignored), lalu:

```bash
npm run apk:release
```

## Langkah 8 — Bagikan APK-nya

Bucket R2 yang sudah dipakai Hohoo adalah tempat paling praktis: upload
APK-nya, lalu bagikan URL `R2_PUBLIC_BASE_URL/...`. Tidak perlu server baru.

Yang perlu diberitahu ke teman-teman saat pasang pertama kali: Android menolak
APK dari luar Play Store sampai **Install unknown apps** diizinkan untuk
browser atau file manager yang mereka pakai (Settings → Apps → akses khusus).

---

## Update ke depannya

- **Ganti apa pun di web** (fitur, UI, bug fix) → cukup deploy Project 3. APK
  tidak perlu dibuat ulang, karena seluruh UI-nya di-load dari server.
- **Rebuild APK hanya kalau**: token dirotasi, URL deployment berubah, ikon atau
  splash diganti, plugin Capacitor ditambah, atau `version` dinaikkan.
- Naikkan `versionCode` / `versionName` di `android/app/build.gradle` setiap
  bikin APK baru, biar bisa dipasang menimpa yang lama.

## Batasan yang sudah diketahui

- **Login Google tidak tersedia di app.** Google menolak OAuth di dalam embedded
  WebView (`disallowed_useragent`), jadi tombolnya disembunyikan otomatis saat
  jalan di app (`hooks/useIsInkuraApp.ts`) dan login pakai email/username +
  password. Kalau nanti mau Google di app: buka flow-nya di Custom Tab lewat
  `@capacitor/browser`, atau pakai native Google Sign-In.
- **Kuota data.** `next.config.ts` menyetel `images.unoptimized: true`, jadi
  cover dan halaman komik dikirim resolusi aslinya. Di HP ini terasa. Perbaikan
  yang masuk akal nanti: varian kecil khusus cover di grid, sementara gambar
  reader tetap resolusi asli.
- **Belum ada offline.** Tidak ada service worker atau cache chapter. Tanpa
  internet, app menampilkan halaman error WebView bawaan Android. Untuk
  menggantinya dengan halaman sendiri, coba tambahkan `errorPath: "index.html"`
  di bawah `server` pada `capacitor.config.ts` (hapus lagi kalau versi
  Capacitor-mu menolak key itu).
- **Belum ada push notification.** Notifikasi hidup di DB dan hanya terlihat
  saat app dibuka. Butuh FCM + `@capacitor/push-notifications` kalau mau.
- **Tombol back Android** mengikuti history WebView, dan keluar dari app kalau
  sudah di halaman paling awal. `@capacitor/app` sudah terpasang kalau nanti
  mau dikustomisasi (mis. konfirmasi sebelum keluar).
- **Status bar.** Android 15 menyalakan edge-to-edge secara default, yang bikin
  navbar web bisa menyelip di bawah jam. Itu sudah dimatikan lewat
  `StatusBar.overlaysWebView: false` di `capacitor.config.ts` — kalau ternyata
  masih bertabrakan, di situ tempat memperbaikinya.
- **Email reset password menuju domain yang digate.** Link di email mengarah ke
  Project 3, dan kalau dibuka di browser kena 404. Dua pilihan: (a) reset
  password manual dari panel admin, atau (b) kalau mau link email benar-benar
  jalan, kecualikan `/auth/reset` dan `/api/auth/password-reset/` di
  `isAppModeExempt()` pada `apps/web/middleware.ts` — konsekuensinya dua halaman
  itu jadi terbuka di browser.
- **Analytics ikut tercatat.** Trafik dari app masuk ke tabel analytics yang
  sama dengan Project 2.
- **File di R2 tetap publik.** Cover dan halaman komik disajikan dari URL R2
  publik, persis seperti sekarang — gate APP_MODE tidak mengubah itu.

## Troubleshooting

| Gejala | Penyebab paling sering |
|---|---|
| App blank, atau `404 — Not Found` di semua halaman | Token di `app.config.json` beda dengan `APP_ACCESS_TOKEN` di Vercel. Cek typo, lalu `npm run sync` dan build ulang — token ter-bake ke project native, jadi mengedit JSON saja tidak cukup. |
| Semua halaman 404 padahal token benar | `APP_MODE=true` tapi `APP_ACCESS_TOKEN` kosong di Vercel, jadi gate fail closed. |
| Login berhasil lalu balik ke signin terus | `NEXTAUTH_URL` di Project 3 tidak sama dengan URL yang dibuka WebView. |
| `cap sync` error soal config | `app.config.json` belum dibuat, atau JSON-nya invalid. |
| Build gradle gagal soal Java | JDK bukan 21, atau `JAVA_HOME` menunjuk ke versi lain. |
| Mau lihat error di dalam WebView | Set `webContentsDebuggingEnabled: true` di `capacitor.config.ts`, `npm run sync`, build debug, lalu buka `chrome://inspect` di desktop. Kembalikan ke `false` sebelum bikin release. |

## Yang berubah di `apps/web` untuk ini

- `middleware.ts` — gate `APP_MODE` (no-op kalau env-nya tidak diset, jadi
  Project 1 dan 2 tidak terpengaruh)
- `lib/appMode.ts` — penanda User-Agent + pembanding token
- `hooks/useIsInkuraApp.ts` — deteksi app di sisi client
- `app/auth/signin/page.tsx` — tombol Google disembunyikan saat jalan di app
- `app/globals.css` — `cursor: none` dibatasi ke pointer presisi, supaya tidak
  aktif di layar sentuh
- `.env.example` — dokumentasi `APP_MODE` / `APP_ACCESS_TOKEN`
