import "client-only";

import { useEffect, useState } from "react";
import { isInkuraAppUserAgent } from "@/lib/appMode";

/**
 * v31: true when the page is running inside the Inkura APK WebView.
 *
 * Starts false and flips after mount so server and client render the same markup
 * on first paint (the server has no way to know, and guessing would hydrate wrong).
 */
export function useIsInkuraApp() {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    setIsApp(isInkuraAppUserAgent(window.navigator.userAgent));
  }, []);

  return isApp;
}
