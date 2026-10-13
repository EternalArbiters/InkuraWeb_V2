/**
 * Inkura v31 — shared helpers for the Android APK build ("Inkura App").
 *
 * The APK is a Capacitor shell whose WebView loads a dedicated Vercel
 * deployment (Project 3). That deployment runs with APP_MODE=true, which makes
 * `middleware.ts` answer 404 to every request that does not come from the APK,
 * so the site is never browsable from a normal browser.
 *
 * The APK identifies itself by appending a marker to its WebView User-Agent:
 *
 *   InkuraApp/<version> (key=<APP_ACCESS_TOKEN>)
 *
 * IMPORTANT — this token is obfuscation, not authentication. Anyone who unzips
 * the APK can read it, and the User-Agent is also sent to third parties the
 * WebView talks to (R2, OAuth providers). It exists to keep the deployment out
 * of browsers and crawlers, not to protect data. Real protection stays where it
 * already is: NextAuth sessions plus the per-route authorization checks.
 */

/** Non-secret part of the APK User-Agent. Safe to use for client-side UI checks. */
export const APP_UA_MARKER = "InkuraApp";

const APP_UA_KEY_PATTERN = /InkuraApp\/[\w.+-]+\s*\(key=([A-Za-z0-9_-]+)\)/;

/** True when the request/browser is the Inkura APK WebView. */
export function isInkuraAppUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return userAgent.includes(APP_UA_MARKER);
}

/** Pulls the app key out of the APK User-Agent, or null when absent/malformed. */
export function appKeyFromUserAgent(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const match = APP_UA_KEY_PATTERN.exec(userAgent);
  return match?.[1] ?? null;
}

/**
 * Length-safe string compare. Edge runtime has no crypto.timingSafeEqual, and
 * the token is not a real secret anyway — this only avoids the most trivial
 * early-exit leak.
 */
export function matchesAppKey(presented: string | null | undefined, expected: string): boolean {
  if (!expected || !presented) return false;
  if (presented.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= presented.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
