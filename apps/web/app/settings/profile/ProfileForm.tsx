"use client";

import * as React from "react";

import { sendUploadMetric } from "@/lib/clientMetrics";
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

type AvatarPresignResponse = {
  uploadUrl: string;
  publicUrl: string;
};

type ApiErrorPayload = {
  error?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

async function parseResponsePayload(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json().catch(() => null);
  }
  return res.text().catch(() => "");
}

function readApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const error = (payload as ApiErrorPayload).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return fallback;
}

async function presignAvatarUpload(file: File): Promise<AvatarPresignResponse> {
  const res = await fetch("/api/me/avatar/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  const payload = await parseResponsePayload(res);
  if (!res.ok) {
    throw new Error(readApiError(payload, "Upload failed"));
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Upload failed");
  }

  const { uploadUrl, publicUrl } = payload as Partial<AvatarPresignResponse>;
  if (typeof uploadUrl !== "string" || typeof publicUrl !== "string") {
    throw new Error("Upload failed");
  }

  return { uploadUrl, publicUrl };
}

async function saveProfile(payload: {
  name: string;
  username: string;
  image: string | null;
  avatarFocusX: number;
  avatarFocusY: number;
  avatarZoom: number;
}) {
  const res = await fetch("/api/me/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responsePayload = await parseResponsePayload(res);
  if (!res.ok) {
    throw new Error(readApiError(responsePayload, "Failed to save"));
  }
}

export default function ProfileForm({ initial }: { initial: Initial }) {
  const [name, setName] = React.useState(initial.name || "");
  const [username, setUsername] = React.useState(initial.username || "");
  const [image, setImage] = React.useState(initial.image || "");

  const [avatarFocusX, setAvatarFocusX] = React.useState<number>(initial.avatarFocusX ?? 50);
  const [avatarFocusY, setAvatarFocusY] = React.useState<number>(initial.avatarFocusY ?? 50);
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
    const startedAt = Date.now();
    let presignMs = 0;
    let uploadMs = 0;
    try {
      const presignStartedAt = Date.now();
      const { uploadUrl, publicUrl } = await presignAvatarUpload(file);
      presignMs = Date.now() - presignStartedAt;
      const uploadStartedAt = Date.now();
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: file.type ? { "Content-Type": file.type } : undefined,
        body: file,
      });
      uploadMs = Date.now() - uploadStartedAt;
      if (!uploadRes.ok) throw new Error("Upload failed");
      setImage(publicUrl);
      setOk("Avatar uploaded");
      sendUploadMetric({
        scope: "avatar",
        beforeBytes: file.size,
        afterBytes: file.size,
        durationMs: Date.now() - startedAt,
        presignMs,
        uploadMs,
        contentType: file.type,
        compressionApplied: false,
        outcome: "success",
      });
    } catch (error: unknown) {
      sendUploadMetric({
        scope: "avatar",
        beforeBytes: file.size,
        afterBytes: file.size,
        durationMs: Date.now() - startedAt,
        presignMs,
        uploadMs,
        contentType: file.type,
        compressionApplied: false,
        outcome: "error",
        errorMessage: getErrorMessage(error, "Upload failed"),
      });
      setErr(getErrorMessage(error, "Upload failed"));
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
      await saveProfile({
        name,
        username,
        image: image || null,
        avatarFocusX,
        avatarFocusY,
        avatarZoom,
      });
      setOk("Saved");
    } catch (error: unknown) {
      setErr(getErrorMessage(error, "Failed"));
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
          setAvatarFocusX(50);
          setAvatarFocusY(50);
          setAvatarZoom(1);
        }}
      />

      <ProfileFieldsCard
        name={name}
        onNameChange={setName}
        username={username}
        onUsernameChange={(v) => setUsername(v.replace(/\s+/g, "").toLowerCase())}
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
