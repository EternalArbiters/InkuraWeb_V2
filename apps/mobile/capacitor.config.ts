import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Inkura Android shell.
 *
 * This APK is a thin Capacitor WebView around the APP_MODE deployment
 * (Vercel Project 3). Nothing is bundled: every screen is the real Next.js app,
 * so shipping a web change needs no new APK — only a redeploy.
 *
 * Real values live in app.config.json (gitignored, copy from the .example),
 * or in INKURA_APP_URL / INKURA_APP_KEY env vars for CI.
 * See docs/mobile-app-capacitor.md for the full build + release runbook.
 */

type LocalConfig = {
  url?: string;
  key?: string;
  version?: string;
  appId?: string;
  appName?: string;
  allowNavigation?: string[];
};

function loadLocalConfig(): LocalConfig {
  const file = resolve(process.cwd(), "app.config.json");
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8")) as LocalConfig;
  } catch (err) {
    throw new Error(`apps/mobile/app.config.json is not valid JSON: ${(err as Error).message}`);
  }
}

const local = loadLocalConfig();

const appUrl = (process.env.INKURA_APP_URL ?? local.url ?? "").trim().replace(/\/+$/, "");
const appKey = (process.env.INKURA_APP_KEY ?? local.key ?? "").trim();
const appVersion = (local.version ?? "1.0").trim();

if (!appUrl || !appKey) {
  throw new Error(
    [
      "Missing Hohoho app config.",
      "",
      "  cp app.config.example.json app.config.json",
      "",
      "then fill in:",
      "  url = the Project 3 deployment URL (APP_MODE=true)",
      "  key = the exact same string as APP_ACCESS_TOKEN on Project 3",
      "",
      "Without a matching key every request is answered with 404 and the app shows a blank screen.",
    ].join("\n"),
  );
}

const appHost = new URL(appUrl).host;

const config: CapacitorConfig = {
  appId: local.appId ?? "id.inkura.app",
  appName: local.appName ?? "Hohoho",

  // Required by the CLI even though the UI is remote. Holds the pre-connection
  // placeholder only — see www/index.html.
  webDir: "www",

  server: {
    // Remote UI: the WebView loads Project 3 directly.
    url: appUrl,
    androidScheme: "https",
    cleartext: false,
    // Hosts the WebView may navigate to. The catalog host is enough; image and
    // script subresources (R2, CDN) are not navigations and are unaffected.
    allowNavigation: [appHost, ...(local.allowNavigation ?? [])],
  },

  android: {
    // This is what gets the APK past the APP_MODE gate in apps/web/middleware.ts.
    appendUserAgent: `InkuraApp/${appVersion} (key=${appKey})`,
    allowMixedContent: false,
    // Flip to true only while debugging over chrome://inspect.
    webContentsDebuggingEnabled: false,
    backgroundColor: "#0c1538",
  },

  plugins: {
    SplashScreen: {
      backgroundColor: "#0c1538",
      showSpinner: false,
      launchAutoHide: true,
      launchShowDuration: 600,
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c1538",
      // Keep the web content below the status bar. Android 15 (API 35, which
      // Capacitor 7 targets) turns on edge-to-edge by default, which would let
      // the Inkura navbar slide under the clock.
      overlaysWebView: false,
    },
  },
};

export default config;
