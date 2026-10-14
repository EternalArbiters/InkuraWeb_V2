// apps/mobile's android/ project is gitignored and fully regenerable
// (`npm run android:add`) — nothing hand-edited there survives a fresh `cap add`
// on its own. This script re-applies the one native customization that can't be
// expressed through capacitor.config.ts: persistent (swipe-to-reveal) immersive
// status-bar hiding on Android. It runs automatically as part of `npm run sync`.
//
// `@capacitor/status-bar`'s JS `StatusBar.hide()` alone is NOT enough — on Android
// it gets undone by a touch near the top edge or by the keyboard opening/closing.
// The reliable fix needs a couple of lines in MainActivity's onCreate/onResume via
// AndroidX WindowInsetsControllerCompat, which only exists as native Java source.
//
// Idempotent: finds the real MainActivity.java (package name follows `appId`, so
// its path isn't fixed), checks for the MARKER below, and only rewrites the file
// if that marker is missing — safe to run on every `sync`, including repeatedly.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const MARKER = "applyImmersiveStatusBar";
const JAVA_ROOT = "android/app/src/main/java";

function findMainActivity(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const found = findMainActivity(full);
      if (found) return found;
    } else if (entry === "MainActivity.java") {
      return full;
    }
  }
  return null;
}

const path = findMainActivity(JAVA_ROOT);
if (!path) {
  console.log("[patch-native] MainActivity.java tidak ditemukan — lewati (android/ belum di-generate?)");
  process.exit(0);
}

const current = readFileSync(path, "utf8");
if (current.includes(MARKER)) {
  console.log("[patch-native] sudah terpasang, tidak diapa-apakan:", path);
  process.exit(0);
}

const packageLine = current.match(/^package\s+[\w.]+;/m)?.[0];
if (!packageLine) {
  throw new Error(`[patch-native] tidak ketemu baris "package ...;" di ${path} — format tidak dikenali, cek manual`);
}

const patched = `${packageLine}

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
}
`;

writeFileSync(path, patched, "utf8");
console.log("[patch-native] status bar immersive dipasang:", path);
