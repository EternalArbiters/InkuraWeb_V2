"use client";

import { useEffect, useState } from "react";

type UpdateInfo = { downloadUrl: string };

// v36: forced-update wall for the Android shell only. Completely inert anywhere
// else — Capacitor's own JS packages are dynamically imported (not a static
// top-level import) so neither their code nor this check ships to, or runs for,
// any normal browser visit; the platform check below is the actual gate.
//
// Fails OPEN on every uncertain path on purpose: no APP_MIN_VERSION configured,
// a network hiccup, an unexpected plugin response shape — none of these should
// ever lock someone out of an app they could already open. The one thing this
// blocks on is an explicit, confirmed "your installed build is older than the
// one the admin published."
//
// No dismiss affordance anywhere here by design (no close button, no backdrop
// click, no Escape handler) — the whole point is that it does not go away until
// the installed build is actually new enough, which only happens after the user
// installs the new APK and reopens the app.
export default function ForceUpdateGate() {
  const [needsUpdate, setNeedsUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.getPlatform() !== "android") return;

        const { App } = await import("@capacitor/app");
        const [info, versionRes] = await Promise.all([
          App.getInfo(),
          fetch("/api/app/version", { cache: "no-store" }).then((r) => r.json()),
        ]);

        const installedBuild = Number(info?.build) || 0;
        const minVersion = Number(versionRes?.minVersion) || 0;
        const downloadUrl = String(versionRes?.downloadUrl || "").trim();

        const outdated = minVersion > 0 && installedBuild > 0 && installedBuild < minVersion && !!downloadUrl;
        if (!cancelled && outdated) {
          setNeedsUpdate({ downloadUrl });
        }
      } catch {
        // Deliberately silent — see the fail-open note above.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!needsUpdate) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="force-update-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(8, 15, 40, 0.97)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          maxWidth: 360,
          width: "100%",
          borderRadius: 20,
          padding: "28px 24px",
          background: "#15214e",
          border: "1px solid #233c7e",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 18px",
            borderRadius: 16,
            background: "linear-gradient(to right, #1e3166, #4574d3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
          }}
        >
          ⬆
        </div>

        <h2 id="force-update-title" style={{ color: "#e9f2fc", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
          Update tersedia
        </h2>
        <p style={{ color: "#8099c9", fontSize: 14, lineHeight: 1.6, margin: "0 0 22px" }}>
          Ada versi baru Hohoo. Update dulu sebelum lanjut pakai aplikasi — datamu aman,
          tidak akan hilang.
        </p>

        <a
          href={needsUpdate.downloadUrl}
          style={{
            display: "block",
            width: "100%",
            padding: "13px 0",
            borderRadius: 12,
            background: "linear-gradient(to right, #1e3166, #4574d3)",
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Update sekarang
        </a>
      </div>
    </div>
  );
}
