"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

type Profile = {
  email: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

export default function ProfileForm({ initial }: { initial: Profile }) {
  const { update } = useSession();

  const [name, setName] = useState(initial.name ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [image, setImage] = useState(initial.image ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatar = useMemo(() => {
    if (localPreview) return localPreview;
    const v = (image || initial.image || "").trim();
    return v || "/images/default-avatar.png";
  }, [image, initial.image, localPreview]);

  useEffect(() => {
    setName(initial.name ?? "");
    setUsername(initial.username ?? "");
    setImage(initial.image ?? "");
    setLocalPreview(null);
  }, [initial]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
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
      setOk("Avatar uploaded. Click 'Save changes' to apply.");
    } catch (e: any) {
      setError(e?.message || "Failed to upload avatar");
      setLocalPreview(null);
    } finally {
      setAvatarUploading(false);
      // Revoke preview URL after a short delay (allow Image to render)
      setTimeout(() => {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {
          // ignore
        }
      }, 1500);
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
      body: JSON.stringify({ name, username, image }),
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

    // Refresh NextAuth session so navbar updates name/image without re-login.
    try {
      await update();
    } catch {
      // ignore
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14">
          <Image src={avatar} alt="Avatar" fill className="rounded-full border border-gray-300 dark:border-gray-700 object-cover" />
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
