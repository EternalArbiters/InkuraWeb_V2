"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Avatar from "@/app/components/Avatar";
import ThumbCropper from "@/app/components/ThumbCropper";

type Profile = {
  email: string;
  username: string | null;
  name: string | null;
  image: string | null;
  avatarFocusX?: number | null;
  avatarFocusY?: number | null;
  avatarZoom?: number | null;
};

function clamp(n: unknown, def: number, min: number, max: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return def;
  return Math.max(min, Math.min(max, v));
}

export default function ProfileForm({ initial }: { initial: Profile }) {
  const { update } = useSession();

  const [name, setName] = useState(initial.name ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [image, setImage] = useState(initial.image ?? "");

  // Avatar adjust (position + zoom)
  const [avatarFocusX, setAvatarFocusX] = useState<number>(clamp(initial.avatarFocusX, 50, 0, 100));
  const [avatarFocusY, setAvatarFocusY] = useState<number>(clamp(initial.avatarFocusY, 50, 0, 100));
  const [avatarZoom, setAvatarZoom] = useState<number>(clamp(initial.avatarZoom, 1, 1, 2.5));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarSrc = useMemo(() => {
    if (localPreview) return localPreview;
    const v = (image || initial.image || "").trim();
    return v || "/images/default-avatar.png";
  }, [image, initial.image, localPreview]);

  useEffect(() => {
    setName(initial.name ?? "");
    setUsername(initial.username ?? "");
    setImage(initial.image ?? "");
    setAvatarFocusX(clamp(initial.avatarFocusX, 50, 0, 100));
    setAvatarFocusY(clamp(initial.avatarFocusY, 50, 0, 100));
    setAvatarZoom(clamp(initial.avatarZoom, 1, 1, 2.5));
    setLocalPreview(null);

    // Cleanup any previous object URL.
    if (previewUrlRef.current) {
      try {
        URL.revokeObjectURL(previewUrlRef.current);
      } catch {
        // ignore
      }
      previewUrlRef.current = null;
    }
  }, [initial]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        try {
          URL.revokeObjectURL(previewUrlRef.current);
        } catch {
          // ignore
        }
        previewUrlRef.current = null;
      }
    };
  }, []);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const resetAvatarAdjust = () => {
    setAvatarFocusX(50);
    setAvatarFocusY(50);
    setAvatarZoom(1);
  };

  const uploadAvatarFile = async (file: File) => {
    setError(null);
    setOk(null);

    // Basic client guards
    if (!file.type || !file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG/JPG/WebP)." );
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar too large. Max 2MB.");
      return;
    }

    // Local preview while uploading
    const previewUrl = URL.createObjectURL(file);
    if (previewUrlRef.current) {
      try {
        URL.revokeObjectURL(previewUrlRef.current);
      } catch {
        // ignore
      }
    }
    previewUrlRef.current = previewUrl;
    setLocalPreview(previewUrl);
    setAvatarUploading(true);

    try {
      const presignRes = await fetch("/api/me/avatar/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });

      const presignData = await presignRes.json().catch(() => ({} as any));
      if (!presignRes.ok) {
        throw new Error(String(presignData?.error || "Failed to prepare upload"));
      }

      const putUrl = presignData?.uploadUrl?.uploadUrl || presignData?.uploadUrl || "";
      const publicUrl = presignData?.publicUrl || presignData?.uploadUrl?.publicUrl || "";
      if (!putUrl || !publicUrl) throw new Error("Upload URL missing");

      const putRes = await fetch(putUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");

      setImage(publicUrl);
      setOk("Avatar uploaded. Adjust position/zoom if needed, then click 'Save changes'.");

      // New image, reset crop defaults.
      resetAvatarAdjust();

      // Keep preview until Save (so user sees exact file), but if you prefer,
      // you can uncomment the next line to show the public URL immediately.
      // setLocalPreview(null);
    } catch (e: any) {
      setError(e?.message || "Failed to upload avatar");
      setLocalPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // reset input so selecting same file again still triggers change
    e.target.value = "";
    await uploadAvatarFile(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);

    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        username,
        image,
        avatarFocusX: Math.round(clamp(avatarFocusX, 50, 0, 100)),
        avatarFocusY: Math.round(clamp(avatarFocusY, 50, 0, 100)),
        avatarZoom: Number(clamp(avatarZoom, 1, 1, 2.5).toFixed(2)),
      }),
    }).catch(() => null);

    if (!res) {
      setSaving(false);
      setError("Network error. Please try again.");
      return;
    }

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      setSaving(false);
      setError(String(data?.error || "Failed to save"));
      return;
    }

    setSaving(false);
    setOk("Saved.");

    // Once saved, drop local preview so we use the public URL.
    setLocalPreview(null);

    // Refresh NextAuth session so navbar updates without re-login.
    try {
      await update();
    } catch {
      // ignore
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
          <Avatar
            src={avatarSrc}
            alt="Avatar"
            focusX={avatarFocusX}
            focusY={avatarFocusY}
            zoom={avatarZoom}
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-gray-500 dark:text-gray-400">Signed in as</div>
          <div className="font-semibold text-gray-900 dark:text-white truncate">{initial.email}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onAvatarChange}
        />
        <button
          type="button"
          onClick={openFilePicker}
          disabled={avatarUploading}
          className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {avatarUploading ? "Uploading..." : "Change photo"}
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">PNG/JPG/WebP • max 2MB</span>
      </div>

      {/* Avatar position + zoom (Instagram-like) */}
      <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">Avatar position & zoom</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Geser untuk atur posisi. Scroll/Pinch untuk zoom. (Ini cuma ngubah tampilan crop, bukan re-upload file.)
            </div>
          </div>
          <button
            type="button"
            onClick={resetAvatarAdjust}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Reset
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,360px)_1fr] md:items-start">
          <ThumbCropper
            src={avatarSrc}
            value={{ focusX: avatarFocusX, focusY: avatarFocusY, zoom: avatarZoom }}
            onChange={(v) => {
              setAvatarFocusX(v.focusX);
              setAvatarFocusY(v.focusY);
              setAvatarZoom(v.zoom);
            }}
            disabled={false}
            aspectClassName="aspect-square"
            frameClassName="max-w-[360px]"
            roundedClassName="rounded-none"
            help="Tip: pakai trackpad/scroll untuk zoom. Di HP bisa pinch zoom."
          />

          <div className="grid gap-3">
            <label className="grid gap-1 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-300">
                <span>Zoom</span>
                <span>{avatarZoom.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.05}
                value={avatarZoom}
                onChange={(e) => setAvatarZoom(parseFloat(e.target.value))}
              />
              <div className="text-[11px] text-gray-600 dark:text-gray-300">
                Kalau wajah kepotong, zoom-out sedikit lalu geser.
              </div>
            </label>

            <div className="text-[11px] text-gray-600 dark:text-gray-300">
              * Avatar final ditampilkan dalam bentuk lingkaran (navbar), tapi posisi/zoom mengikuti setting ini.
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {ok ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          {ok}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Display name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">This is shown in the navbar.</div>
        </label>

        <label className="block">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Username</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="username"
            className="mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">3–24 chars: letters/numbers, - or _</div>
        </label>

        <label className="block md:col-span-2">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Avatar URL (optional)</div>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://... or /images/..."
            className="mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">If left blank, Inkura will keep your current avatar.</div>
        </label>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
