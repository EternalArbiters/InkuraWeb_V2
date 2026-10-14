// apps/mobile's android/ project is gitignored and fully regenerable
// (`npm run android:add`) — nothing hand-edited there survives a fresh `cap add`
// on its own. This script re-applies the native customizations that can't be
// expressed through capacitor.config.ts, every time `npm run sync` runs:
//
//   1. MainActivity.java — two things the JS layer can't do on its own:
//        a. persistent (swipe-to-reveal) immersive status-bar hiding.
//           @capacitor/status-bar's JS `StatusBar.hide()` alone is NOT enough on
//           Android: it gets undone by a touch near the top edge or by the
//           keyboard opening/closing.
//        b. a DownloadListener on the WebView, so tapping a direct file link
//           (the forced-update flow's "Update" button) actually triggers a
//           download via the system browser instead of doing nothing.
//
//   2. app/build.gradle — wires up release signing from apps/mobile/keystore.properties
//      (itself outside android/, so IT survives a regenerate; only the gradle
//      wiring pointing at it needs reapplying). Safe to build without it present
//      (e.g. a fresh clone with no release keystore yet) — assembleRelease then
//      just produces an unsigned APK instead of failing.
//
// Both patches are idempotent: each checks its own marker and only rewrites its
// file when that marker is missing, so running this repeatedly is a no-op.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

function findFile(dir, name) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const found = findFile(full, name);
      if (found) return found;
    } else if (entry === name) {
      return full;
    }
  }
  return null;
}

function patchMainActivity() {
  // v36: bumped from the status-bar-only marker so a file patched by an older
  // version of this script (status bar, no download listener yet) is correctly
  // recognized as stale and gets fully rewritten to include both.
  const MARKER = "registerApkDownloadListener";
  const path = findFile("android/app/src/main/java", "MainActivity.java");
  if (!path) {
    console.log("[patch-native] MainActivity.java tidak ditemukan — lewati (android/ belum di-generate?)");
    return;
  }

  const current = readFileSync(path, "utf8");
  if (current.includes(MARKER)) {
    console.log("[patch-native] MainActivity: sudah terpasang, tidak diapa-apakan");
    return;
  }

  const packageLine = current.match(/^package\s+[\w.]+;/m)?.[0];
  if (!packageLine) {
    throw new Error(`[patch-native] tidak ketemu baris "package ...;" di ${path} — format tidak dikenali, cek manual`);
  }

  const patched = `${packageLine}

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

// Ditulis otomatis oleh scripts/patch-native.mjs setiap \`npm run sync\`. File ini ada
// di dalam android/ yang gitignored, jadi JANGAN andalkan isinya bertahan sendiri
// kalau android/ pernah dihapus+dibuat ulang — patch ini yang menjaganya.
public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    applyImmersiveStatusBar();
    registerApkDownloadListener();
  }

  @Override
  public void onResume() {
    super.onResume();
    // StatusBar.hide() lewat JS saja gampang kebatalkan (sentuh dekat tepi atas,
    // atau keyboard buka/tutup) — menerapkan ulang di sini yang bikin bener-bener
    // nempel, bukan cuma kelihatan jalan sekali lalu balik lagi.
    applyImmersiveStatusBar();
  }

  private void applyImmersiveStatusBar() {
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    WindowInsetsControllerCompat controller =
        new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
    controller.hide(WindowInsetsCompat.Type.statusBars());
    // Swipe dari tepi atas memunculkan status bar sebentar (cek jam/notifikasi),
    // lalu sembunyi lagi sendiri — perilaku "immersive" standar Android, bukan
    // dikunci permanen.
    controller.setSystemBarsBehavior(
        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
  }

  // Capacitor's bare WebView has NO DownloadListener registered by default — tapping
  // a direct file link (e.g. the forced-update "Update" button pointing at the latest
  // APK) just does nothing, silently. This hands any such navigation off to the
  // system (external browser / Download Manager), which then shows real download
  // progress and, once finished, offers to open/install the file — exactly what a
  // plain browser tab would do.
  private void registerApkDownloadListener() {
    getBridge()
        .getWebView()
        .setDownloadListener(
            (url, userAgent, contentDisposition, mimeType, contentLength) -> {
              Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
              intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
              startActivity(intent);
            });
  }
}
`;

  writeFileSync(path, patched, "utf8");
  console.log("[patch-native] status bar immersive + download listener dipasang:", path);
}

function patchBuildGradle() {
  const MARKER = "keystoreProperties";
  const path = "android/app/build.gradle";
  if (!existsSync(path)) {
    console.log("[patch-native] app/build.gradle tidak ditemukan — lewati (android/ belum di-generate?)");
    return;
  }

  const current = readFileSync(path, "utf8");
  if (current.includes(MARKER)) {
    console.log("[patch-native] release signing: sudah terpasang, tidak diapa-apakan");
    return;
  }

  const ANCHOR_TOP = "apply plugin: 'com.android.application'";
  const ANCHOR_ANDROID_BLOCK = "\nandroid {";
  const ANCHOR_RELEASE_PROGUARD =
    "proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'";

  if (!current.includes(ANCHOR_TOP) || !current.includes(ANCHOR_ANDROID_BLOCK) || !current.includes(ANCHOR_RELEASE_PROGUARD)) {
    throw new Error(
      `[patch-native] ${path} tidak cocok dengan struktur template Capacitor yang diharapkan — cek manual, jangan dipaksa patch`,
    );
  }

  // apps/mobile/keystore.properties lives OUTSIDE android/ on purpose (like
  // app.config.json) so it survives a full android/ wipe+regenerate on its own.
  // rootProject here is the android/ Gradle root, so '../keystore.properties'
  // resolves to apps/mobile/keystore.properties.
  const loader = `
// Ditulis otomatis oleh scripts/patch-native.mjs setiap \`npm run sync\`. Baca
// apps/mobile/keystore.properties (di LUAR android/, jadi selamat dari regenerate)
// untuk release signing. Kalau file itu belum ada (mis. clone baru, belum bikin
// keystore release), build tetap jalan — assembleRelease jadi APK tak bertanda
// tangan saja, bukan gagal total.
def keystorePropertiesFile = rootProject.file('../keystore.properties')
def keystoreProperties = new Properties()
def hasReleaseSigning = keystorePropertiesFile.exists()
if (hasReleaseSigning) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
`;

  let patched = current.replace(ANCHOR_TOP, ANCHOR_TOP + "\n" + loader);

  const signingConfigsBlock = `
    signingConfigs {
        if (hasReleaseSigning) {
            release {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }`;
  patched = patched.replace(ANCHOR_ANDROID_BLOCK, ANCHOR_ANDROID_BLOCK + signingConfigsBlock);

  patched = patched.replace(
    ANCHOR_RELEASE_PROGUARD,
    ANCHOR_RELEASE_PROGUARD +
      `
            if (hasReleaseSigning) {
                signingConfig signingConfigs.release
            }`,
  );

  writeFileSync(path, patched, "utf8");
  console.log("[patch-native] release signing dipasang:", path);
}

patchMainActivity();
patchBuildGradle();
