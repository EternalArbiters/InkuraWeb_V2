# Tutorial Lengkap: Bikin APK Hohoo dari Nol

Panduan ini ditulis dengan asumsi kamu **belum pernah bikin APK sama sekali**.
Semua langkah ditulis apa adanya: perintah yang diketik, tombol yang diklik, dan
apa yang seharusnya muncul di layar.

Untuk tabel referensi (daftar env, batasan, troubleshooting teknis), lihat
[`mobile-app-capacitor.md`](mobile-app-capacitor.md). Dokumen ini jalurnya,
dokumen itu peta detailnya.

---

## Apa yang sebenarnya kita bikin

APK Hohoo **bukan** aplikasi yang isinya ditulis ulang. Isinya adalah
"browser mini" yang cuma bisa membuka satu alamat: deployment Hohoo khusus app.
Jadi:

- Semua halaman, fitur, dan tampilan = web Hohoo yang sudah ada
- Kalau kamu ubah kode web lalu deploy, **app teman-temanmu langsung ikut
  berubah** tanpa bikin APK baru
- Alamat itu dikunci: dibuka di browser biasa hasilnya 404, cuma APK Hohoo yang
  bisa masuk

Jadi yang perlu dibikin ada dua: **server khusus app** (Fase A) dan **file APK**
(Fase B–D).

### Kondisi komputermu sekarang (sudah kucek)

| | Status |
|---|---|
| Node.js v22 | ✅ sudah ada |
| Git | ✅ sudah ada |
| Android Studio | ❌ belum ada — dipasang di Fase B |
| Java / JDK | ❌ belum ada — **tidak perlu dipasang terpisah**, Android Studio sudah bawa sendiri |

### Perkiraan waktu

| Fase | Isinya | Waktu |
|---|---|---|
| A | Bikin server khusus app (di browser) | ~30 menit |
| B | Pasang Android Studio | ~1 jam, kebanyakan nunggu download |
| C | Bikin file APK | ~20 menit pertama kali, selanjutnya ~3 menit |
| D | Pasang di HP dan bagi ke teman | ~15 menit |

Fase B cuma sekali seumur hidup. Setelah semua ini jalan, bikin APK versi
berikutnya cuma butuh beberapa menit.

---

# FASE A — Bikin server khusus app

Semua langkah di fase ini dilakukan di browser dan terminal, belum menyentuh
Android sama sekali.

## A1. Commit dan push perubahan kode

Vercel mengambil kode dari GitHub (`EternalArbiters/InkuraWeb_V2`), jadi
perubahan yang ada di komputermu harus naik dulu.

Di terminal, dari folder utama repo:

```bash
git add .
git status
```

`git status` akan menampilkan daftar file yang akan ikut. Pastikan isinya
masuk akal (middleware, lib/appMode.ts, folder apps/mobile, docs). Lalu:

```bash
git commit -m "Tambah mode APK: gate APP_MODE + shell Capacitor Android"
git push
```

> **Yang terjadi setelah push:** Vercel Project 2 (link private) ikut
> ter-deploy ulang. Itu aman — gate baru ini mati total kalau `APP_MODE` tidak
> diset, dan Project 2 tidak menyetelnya. Project 1 (`inkura.id`) tetap tidak
> tersentuh selama project-nya dibiarkan paused.

## A2. Bikin token rahasia

Token ini yang membedakan "request dari APK Hohoo" dan "orang iseng buka URL di
browser". Jalankan di terminal:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

Keluarnya satu baris acak, kira-kira seperti:

```
kJ8vQ2mN4pR7xT1wY5zA3bC6dE9fG0hI
```

**Salin dan simpan di Notepad.** Token itu nanti dipakai di dua tempat: di
Vercel (Fase A5) dan di file konfigurasi APK (Fase C2). Keduanya harus sama
persis, beda satu huruf pun app-nya tidak jalan.

## A3. Ambil daftar env dari Project 2

Project 3 butuh env yang hampir sama dengan Project 2 (koneksi database, R2,
dan lain-lain). Mengetik ulang satu-satu rawan typo, jadi tarik saja:

```bash
npx vercel login
```

Ikuti prosesnya (biasanya membuka browser untuk konfirmasi). Lalu:

```bash
npx vercel link
```

Akan muncul pertanyaan beruntun. Jawabannya:

- `Set up ...?` → **y**
- `Which scope?` → pilih akunmu (Enter)
- `Link to existing project?` → **y**
- `What's the name of your existing project?` → ketik nama **Project 2** (yang
  private, mis. `koleksiatmint`)

Lalu tarik env-nya ke sebuah file:

```bash
npx vercel env pull .env.project2 --environment=production
```

Sekarang ada file `.env.project2` di folder repo. File itu **berisi semua
password dan kunci rahasiamu**, tapi aman dari git: pola `.env.*` sudah masuk
`.gitignore`. Buka file itu di VS Code, isinya daftar baris `NAMA=nilai`.

> Kalau langkah ini gagal atau membingungkan, boleh dilewati — kamu juga bisa
> menyalin nilai env satu per satu dari dashboard Vercel Project 2 →
> Settings → Environment Variables.

## A4. Bikin Project 3 di Vercel

1. Buka [vercel.com](https://vercel.com) → tombol **Add New...** (kanan atas) →
   **Project**
2. Di daftar repo, cari **InkuraWeb_V2** → klik **Import**
3. **Project Name**: isi `inkura-app` (nama ini jadi alamatnya nanti:
   `inkura-app.vercel.app`)
4. **Root Directory**: harus sama dengan Project 2. Cara mengeceknya: buka tab
   baru → Project 2 → Settings → General → lihat kolom *Root Directory* →
   samakan. Kalau di sana kosong/`./`, biarkan default di sini juga.
5. **Environment Variables**: buka bagian ini, lalu **paste seluruh isi file
   `.env.project2`** sekaligus (Vercel menerima tempelan banyak baris). Setelah
   itu tambahkan dua baris baru:

   ```
   APP_MODE=true
   APP_ACCESS_TOKEN=<token dari langkah A2>
   ```

   Lalu **hapus baris `CRON_SECRET`** kalau ikut tertempel. (Alasannya: tanpa
   itu, jadwal mingguan rebuild leaderboard di project ini otomatis mati, jadi
   leaderboard tidak dihitung dobel.)

   Pastikan **tidak ada** baris `PRIVATE_MODE` di sini. Kalau ada, hapus —
   baris itu yang bikin katalog terkunci, padahal di app kita mau katalognya
   terbuka normal.
6. Klik **Deploy**, tunggu sampai selesai (2–5 menit)

## A5. Betulkan alamat, lalu deploy ulang

Dua env tadi menyimpan alamat situs, dan alamat barunya baru ketahuan sekarang.

1. Di halaman project yang baru jadi, lihat domainnya (mis.
   `https://inkura-app.vercel.app`) — **salin**
2. Settings → Environment Variables → ubah dua ini jadi alamat tadi:
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_SITE_URL`
3. Tab **Deployments** → deployment paling atas → menu titik tiga → **Redeploy**

## A6. Tes: pastikan gerbangnya mengunci

Buka alamat Project 3 di browser biasa. **Yang benar: muncul halaman hitam
bertuliskan `404 — Not Found`.**

| Yang muncul | Artinya |
|---|---|
| Halaman hitam `404 — Not Found` | ✅ Benar. Gerbang aktif, web tidak bisa dibuka publik. |
| Halaman Hohoo normal | ❌ `APP_MODE` belum terbaca. Cek ejaannya persis `APP_MODE` = `true`, lalu Redeploy. |
| Halaman error Vercel / build failed | ❌ Ada env yang kurang. Buka tab Deployments → klik deployment-nya → baca log paling bawah. |

## A7. Izinkan upload gambar dari alamat baru (CORS R2)

Tanpa langkah ini, upload cover dan halaman komik dari app akan gagal.

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → klik
   bucket Hohoo-mu
2. Tab **Settings** → cari **CORS Policy** → **Edit** / **Add CORS policy**
3. Kalau sudah ada isinya, **tambahkan** entri baru ke dalam daftar (jangan
   ditimpa). Kalau masih kosong, isi seperti ini:

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

   Ganti alamatnya dengan domain Project 3 milikmu. **Save**.

Fase A selesai. Server khusus app sudah hidup dan terkunci.

---

# FASE B — Pasang Android Studio

Android Studio ini pabrik pembuat APK-nya. Ukurannya besar (~1 GB installer,
plus ~2–3 GB komponen), jadi siapkan kuota dan waktu.

## B1. Download dan install

1. Buka <https://developer.android.com/studio>
2. Klik tombol download besar → centang persetujuan → unduh file `.exe`
3. Jalankan installer → **Next** terus → **Install** → **Finish**
   (biarkan semua pilihan default)

## B2. Setup pertama kali

Saat Android Studio pertama dibuka:

1. `Import Settings?` → pilih **Do not import settings** → OK
2. Layar Welcome → **Next**
3. `Install Type` → pilih **Standard** → **Next**
4. Pilih tema (bebas) → **Next**
5. `Verify Settings` → **Next**
6. `License Agreement` → klik tiap item di kiri, pilih **Accept** untuk
   masing-masing → **Finish**
7. Android Studio mengunduh komponen (SDK, emulator, dll). **Ini bagian paling
   lama**, 15–45 menit tergantung internet. Tunggu sampai tombol **Finish**
   bisa diklik.

Selesai. Kamu **tidak perlu** memasang Java/JDK terpisah dan tidak perlu
menyetel `ANDROID_HOME` — selama build-nya lewat tombol di Android Studio,
semua itu sudah diurus sendiri.

---

# FASE C — Bikin file APK

## C1. Pasang bahan-bahan proyek app

Buka terminal di VS Code (**Terminal → New Terminal**, defaultnya PowerShell),
lalu masuk ke folder shell Android:

```powershell
cd "D:\Projek Web Cleo\Projek-Web-AI\inkura-web\apps\mobile"
npm install
```

Tunggu sampai selesai (~1–2 menit). Wajar kalau muncul beberapa baris `warn`.

## C2. Isi konfigurasi app

Yang dibuat di sini adalah file **baru** bernama `app.config.json`. File
`app.config.example.json` harus **tetap ada** — itu template cadangan, jangan
di-rename.

Cara paling aman, lewat terminal PowerShell di folder `apps/mobile`:

```powershell
Copy-Item app.config.example.json app.config.json
```

(Lewat VS Code juga bisa: klik kanan `app.config.example.json` → **Copy** →
klik kanan folder `apps/mobile` → **Paste** → file salinannya yang diganti nama
jadi `app.config.json`. Kalau setelah ini `app.config.example.json` hilang dari
daftar file, berarti yang ter-rename file aslinya — kembalikan dengan
`git checkout -- apps/mobile/app.config.example.json`.)

Buka `apps/mobile/app.config.json`, isi jadi seperti ini:

```json
{
  "url": "https://inkura-app.vercel.app",
  "key": "kJ8vQ2mN4pR7xT1wY5zA3bC6dE9fG0hI",
  "version": "1.0",
  "appId": "id.hohoo.app",
  "appName": "Hohoo"
}
```

- `url` = alamat Project 3 (tanpa garis miring di akhir)
- `key` = token dari langkah A2, **harus sama persis** dengan `APP_ACCESS_TOKEN`
  di Vercel

File ini tidak ikut ter-commit ke git karena berisi token.

## C3. Bikin proyek Android

```bash
npm run android:add
```

Perintah ini membuat folder `apps/mobile/android` — itu proyek Android asli yang
nanti dibuka di Android Studio. Kalau muncul tulisan seperti
`✔ add in ...` berarti berhasil.

> Kalau yang muncul justru pesan error panjang berisi `Missing Hohoo app
> config`, berarti `app.config.json` belum ada atau belum terisi. Balik ke C2.

## C4. Pasang ikon dan splash screen

Ikon dan splash sudah disiapkan di `apps/mobile/assets/` (diambil dari
`logo-inkura.png`). Tinggal dipasang:

```bash
npm run icons
npm run sync
```

`npm run sync` ini yang menyalin konfigurasi (termasuk token) ke dalam proyek
Android. **Setiap kali kamu mengubah `app.config.json`, perintah ini harus
dijalankan lagi.**

## C5. Buka di Android Studio

1. Buka Android Studio → di layar Welcome klik **Open**
   (kalau sudah ada project terbuka: menu **File → Open**)
2. Arahkan ke folder:
   `D:\Projek Web Cleo\Projek-Web-AI\inkura-web\apps\mobile\android`
   — pilih folder **android** itu sendiri, bukan `apps/mobile`, bukan `app`
3. **OK** → kalau ditanya `Trust Project?` → **Trust Project**

Android Studio lalu menjalankan **Gradle Sync** (status jalan di bar bawah).
Pertama kali ini **lama, 5–20 menit**, karena mengunduh Gradle dan komponen SDK.
Tunggu sampai tulisan di bar bawah berhenti dan muncul `Gradle sync finished`.

Kalau muncul notifikasi kuning/merah berisi link seperti *"Install missing SDK
package(s)"* atau *"Install Build Tools ... and sync project"* → **klik link
itu**, setujui lisensinya, tunggu, selesai. Itu normal.

## C6. Build APK-nya

1. Menu atas: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Tunggu (pertama kali 3–10 menit). Progress ada di bar bawah.
3. Muncul notifikasi kecil di kanan bawah: *"APK(s) generated successfully"*
   dengan link **locate**. Klik **locate** → File Explorer terbuka tepat di
   file APK-nya.

Lokasi filenya:

```
apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

Itu APK-mu. Ukurannya kecil (~5 MB) karena isinya memang cuma pembungkus.

---

# FASE D — Pasang di HP dan bagikan

## D1. Pindahkan APK ke HP

Cara paling gampang, tanpa kabel dan tanpa tool tambahan: **kirim file
`app-debug.apk` ke dirimu sendiri** lewat WhatsApp (Chat dengan diri sendiri),
Telegram, atau upload ke Google Drive lalu buka di HP.

## D2. Pasang di HP

1. Buka file APK-nya dari HP (lewat notifikasi unduhan atau File Manager)
2. Android akan menolak dan menampilkan peringatan seperti *"Demi keamanan,
   ponsel tidak diizinkan memasang aplikasi tidak dikenal dari sumber ini"*
3. Ketuk **Setelan** / **Settings** di dialog itu → aktifkan **Izinkan dari
   sumber ini** / **Allow from this source**
4. Tekan kembali → **Install** → **Buka**

## D3. Tes

Yang benar: splash gelap sebentar, lalu langsung halaman Hohoo seperti di web.

| Yang muncul | Penyebab |
|---|---|
| Halaman Hohoo normal | ✅ Berhasil |
| Layar putih / `404 — Not Found` | Token di `app.config.json` ≠ `APP_ACCESS_TOKEN` di Vercel. Betulkan, lalu **wajib** `npm run sync` + build ulang (token ikut tertanam saat build, mengedit JSON saja tidak cukup) |
| "Tidak ada koneksi" | Alamat `url` salah, atau Project 3 sedang gagal deploy |
| Login berhasil tapi balik lagi ke halaman login | `NEXTAUTH_URL` di Vercel belum sama dengan alamat Project 3 (ulangi A5) |

Coba juga: login, buka satu komik, upload gambar. Kalau upload gagal, berarti
CORS R2 (A7) belum benar.

## D4. Bagikan ke teman

Upload `app-debug.apk` ke Google Drive (atau bucket R2-mu), set link-nya jadi
"siapa saja yang punya link", lalu bagikan.

Sertakan instruksi singkat ini, karena teman-temanmu pasti kebingungan di
langkah yang sama:

> Download file-nya, buka, nanti muncul peringatan "aplikasi tidak dikenal" —
> ketuk Setelan, izinkan dari sumber ini, lalu Install.

---

# FASE E — Versi rilis (opsional, nanti saja)

APK debug di atas sudah bisa dipakai sehari-hari. Bedanya versi rilis: ukurannya
lebih kecil, jalannya sedikit lebih ngebut, dan bisa di-update menimpa versi
lama tanpa uninstall.

Kalau nanti mau:

1. Android Studio → **Build** → **Generate Signed App Bundle or APK...**
2. Pilih **APK** → **Next**
3. **Create new...** untuk bikin keystore:
   - Key store path: simpan di luar folder repo, mis.
     `D:\inkura-release.keystore`
   - Isi password, alias (`inkura`), dan data diri seadanya
   - **Catat password-nya baik-baik.** Kalau hilang, update APK berikutnya tidak
     bisa dipasang menimpa yang lama.
4. **Next** → pilih **release** → **Create**
5. APK-nya muncul di `apps\mobile\android\app\build\outputs\apk\release\`

Setiap bikin versi baru, naikkan `versionCode` dan `versionName` di
`apps/mobile/android/app/build.gradle`.

---

# Setelah semua jalan: alur sehari-hari

**Mengubah web (fitur, tampilan, perbaikan bug):**

```bash
git add .
git commit -m "..."
git push
```

Vercel deploy otomatis, dan app di HP teman-temanmu langsung ikut berubah
begitu mereka membukanya. **Tidak perlu bikin atau membagi APK baru.**

**APK baru hanya perlu dibuat kalau:**

- Token dirotasi atau alamat Project 3 berubah
- Ikon atau splash diganti
- Nama/ID aplikasi diubah
- Plugin Capacitor ditambah

Urutannya selalu sama: ubah `app.config.json` atau aset → `npm run sync` →
Build APK di Android Studio.

---

# Kalau macet

| Pesan / gejala | Artinya | Yang dilakukan |
|---|---|---|
| `Missing Hohoo app config` saat `npm run android:add` | `app.config.json` belum dibuat/terisi | Ulangi langkah C2 |
| Gradle sync gagal, menyebut SDK atau Build-Tools | Komponen SDK kurang | Klik link "Install missing..." di notifikasi Android Studio |
| Gradle gagal dengan error aneh soal path | Kadang karena ada spasi di `D:\Projek Web Cleo\...` | Copy folder `apps\mobile\android` ke path tanpa spasi (mis. `D:\inkura-android`), buka dari sana |
| APK jadi, tapi app layar putih | Token tidak cocok | Samakan token, `npm run sync`, build ulang |
| Semua halaman di app 404 | `APP_ACCESS_TOKEN` kosong di Vercel | Isi, lalu Redeploy |
| Upload gambar gagal di app | CORS R2 belum memuat alamat Project 3 | Ulangi A7 |
| Mau lihat error di dalam app | — | Set `webContentsDebuggingEnabled: true` di `apps/mobile/capacitor.config.ts`, `npm run sync`, build ulang, lalu buka `chrome://inspect` di Chrome desktop dengan HP tercolok kabel |

Batasan yang memang sudah diketahui (login Google tidak muncul di app, belum ada
mode offline, belum ada push notification) ada penjelasannya di
[`mobile-app-capacitor.md`](mobile-app-capacitor.md) bagian *Batasan*.
