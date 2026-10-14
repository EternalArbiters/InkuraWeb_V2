# inkura-mobile

Capacitor shell Android untuk Hohoho. Tidak ada UI di sini: WebView-nya me-load
deployment `APP_MODE` (Vercel Project 3), jadi perubahan web cukup dideploy
tanpa bikin APK baru.

Folder ini sengaja di luar npm workspaces repo, jadi `npm install` dijalankan
dari dalam folder ini sendiri.

Runbook lengkap (deploy Project 3, token, build APK, signing, distribusi,
batasan, troubleshooting): [`docs/mobile-app-capacitor.md`](../../docs/mobile-app-capacitor.md)

Mulai cepat:

```bash
npm install
cp app.config.example.json app.config.json   # isi url + key
npm run android:add
npm run sync
npm run apk:debug
```
