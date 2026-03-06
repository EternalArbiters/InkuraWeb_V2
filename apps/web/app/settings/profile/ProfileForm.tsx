"use client";

import * as React from "react";

import { presignAndUpload } from "@/lib/r2UploadClient";
import { apiJson } from "@/server/http/apiJson";

import AvatarPickerCard from "./components/AvatarPickerCard";
import ProfileAlerts from "./components/ProfileAlerts";
import ProfileFieldsCard from "./components/ProfileFieldsCard";

type Initial = {
  email: string;
  name: string;
  username: string;
  image?: string | null;
  avatarFocusX?: number | null;
  avatarFocusY?: number | null;
  avatarZoom?: number | null;
};

export default function ProfileForm({ initial }: { initial: Initial }) {
  const [name, setName] = React.useState(initial.name || "");
  const [username, setUsername] = React.useState(initial.username || "");
  const [image, setImage] = React.useState(initial.image || "");

  const [avatarFocusX, setAvatarFocusX] = React.useState<number>(initial.avatarFocusX ?? 0.5);
  const [avatarFocusY, setAvatarFocusY] = React.useState<number>(initial.avatarFocusY ?? 0.5);
  const [avatarZoom, setAvatarZoom] = React.useState<number>(initial.avatarZoom ?? 1);

  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const avatarPreview = image || initial.image || null;

  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true);
    setErr(null);
    setOk(null);
    try {
      const { publicUrl } = await presignAndUpload(file, "avatar");
      setImage(publicUrl);
      setOk("Avatar uploaded");
    } catch (e: any) {
      setErr(String(e?.message || e || "Upload failed"));
    } finally {
      setAvatarUploading(false);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const res = await apiJson<{ ok: true }>("/api/me/profile", {
        method: "PATCH",
        body: {
          name,
          username,
          image: image || null,
          avatarFocusX,
          avatarFocusY,
          avatarZoom,
        },
      });
      if (!res.ok) throw new Error(res.error || "Failed to save");
      setOk("Saved");
    } catch (e: any) {
      setErr(String(e?.message || e || "Failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto grid gap-6">
      <ProfileAlerts err={err} ok={ok} />

      <AvatarPickerCard
        initialEmail={initial.email}
        avatar={avatarPreview}
        avatarUploading={avatarUploading}
        avatarFocusX={avatarFocusX}
        setAvatarFocusX={setAvatarFocusX}
        avatarFocusY={avatarFocusY}
        setAvatarFocusY={setAvatarFocusY}
        avatarZoom={avatarZoom}
        setAvatarZoom={setAvatarZoom}
        fileInputRef={fileInputRef}
        onAvatarChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          void uploadAvatar(file);
          e.target.value = "";
        }}
        onRemoveImage={() => {
          setImage("");
          setAvatarFocusX(0.5);
          setAvatarFocusY(0.5);
          setAvatarZoom(1);
        }}
      />

      <ProfileFieldsCard
        name={name}
        onNameChange={setName}
        username={username}
        onUsernameChange={(v) => setUsername(v.replace(/\s+/g, "").toLowerCase())}
        image={image}
        onImageChange={setImage}
      />

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={saving || avatarUploading}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
