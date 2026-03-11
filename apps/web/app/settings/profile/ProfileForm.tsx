"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { sendUploadMetric } from "@/lib/clientMetrics";
import { buildOptimizationMeta } from "@/lib/r2UploadClient";
import { prepareUploadFile } from "@/lib/uploadOptimization";
import AvatarPickerCard from "./components/AvatarPickerCard";
import ProfileAlerts from "./components/ProfileAlerts";
import ProfileFieldsCard from "./components/ProfileFieldsCard";

type Initial = {
  email: string;
  name: string;
  username: string;
  bio: string;
  profileUrl: string;
  image?: string | null;
  avatarFocusX?: number | null;
  avatarFocusY?: number | null;
  avatarZoom?: number | null;
  gender?: string | null;
  birthMonth?: number | null;
  birthYear?: number | null;
};

type AvatarPresignResponse = {
  uploadUrl: string;
  publicUrl: string;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const digits = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

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

async function presignAvatarUpload(
  file: File,
  optimizationMeta?: ReturnType<typeof buildOptimizationMeta>
): Promise<AvatarPresignResponse> {
  const res = await fetch("/api/me/avatar/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      optimization: optimizationMeta,
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
  bio: string | null;
  profileUrl: string | null;
  image: string | null;
  avatarFocusX: number;
  avatarFocusY: number;
  avatarZoom: number;
  gender: string | null;
  birthMonth: number | null;
  birthYear: number | null;
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
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = React.useState(initial.name || "");
  const [username, setUsername] = React.useState(initial.username || "");
  const [image, setImage] = React.useState(initial.image || "");
  const [bio, setBio] = React.useState(initial.bio || "");
  const [profileUrl, setProfileUrl] = React.useState(initial.profileUrl || "");

  const [avatarFocusX, setAvatarFocusX] = React.useState<number>(initial.avatarFocusX ?? 50);
  const [avatarFocusY, setAvatarFocusY] = React.useState<number>(initial.avatarFocusY ?? 50);
  const [avatarZoom, setAvatarZoom] = React.useState<number>(initial.avatarZoom ?? 1);
  const [gender, setGender] = React.useState(initial.gender || "");
  const [birthMonth, setBirthMonth] = React.useState<number | "">(initial.birthMonth ?? "");
  const [birthYear, setBirthYear] = React.useState<number | "">(initial.birthYear ?? "");

  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarOptimizationSummary, setAvatarOptimizationSummary] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const avatarPreview = image || initial.image || null;

  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true);
    setErr(null);
    setOk(null);
    setAvatarOptimizationSummary(null);
    const startedAt = Date.now();
    let presignMs = 0;
    let uploadMs = 0;
    let prepared = null as Awaited<ReturnType<typeof prepareUploadFile>> | null;
    try {
      prepared = await prepareUploadFile({ scope: "avatar", file });
      const uploadFile = prepared.file;
      const optimizationVersion = "pr5-upload-guardrails-v1";
      const optimizationMeta = buildOptimizationMeta(prepared, optimizationVersion);
      const presignStartedAt = Date.now();
      const { uploadUrl, publicUrl } = await presignAvatarUpload(uploadFile, optimizationMeta);
      presignMs = Date.now() - presignStartedAt;
      const uploadStartedAt = Date.now();
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: uploadFile.type ? { "Content-Type": uploadFile.type } : undefined,
        body: uploadFile,
      });
      uploadMs = Date.now() - uploadStartedAt;
      if (!uploadRes.ok) throw new Error("Upload failed");
      setImage(publicUrl);
      const bytesSaved = Math.max(0, prepared.originalBytes - prepared.optimizedBytes);
      if (prepared.compressionApplied || bytesSaved > 0) {
        setAvatarOptimizationSummary(`${formatBytes(prepared.originalBytes)} → ${formatBytes(prepared.optimizedBytes)}`);
      } else {
        setAvatarOptimizationSummary(`No optimization needed (${formatBytes(prepared.optimizedBytes)})`);
      }
      setOk("Avatar uploaded");
      sendUploadMetric({
        scope: "avatar",
        beforeBytes: prepared.originalBytes,
        afterBytes: prepared.optimizedBytes,
        durationMs: Date.now() - startedAt,
        presignMs,
        uploadMs,
        contentType: uploadFile.type,
        originalContentType: prepared.originalContentType,
        optimizedContentType: prepared.contentType,
        bytesSaved,
        compressionRatio: prepared.originalBytes > 0 ? Number((prepared.optimizedBytes / prepared.originalBytes).toFixed(4)) : undefined,
        optimizationScope: "avatar",
        optimizationVersion,
        optimizationReason: prepared.reason,
        width: prepared.width,
        height: prepared.height,
        fallbackUsed: !optimizationMeta,
        compressionApplied: prepared.compressionApplied,
        outcome: "success",
      });
    } catch (error: unknown) {
      sendUploadMetric({
        scope: "avatar",
        beforeBytes: prepared?.originalBytes ?? file.size,
        afterBytes: prepared?.optimizedBytes ?? file.size,
        durationMs: Date.now() - startedAt,
        presignMs,
        uploadMs,
        contentType: prepared?.contentType || file.type,
        originalContentType: prepared?.originalContentType || file.type,
        optimizedContentType: prepared?.contentType || file.type,
        bytesSaved: prepared ? Math.max(0, prepared.originalBytes - prepared.optimizedBytes) : 0,
        compressionRatio: prepared && prepared.originalBytes > 0 ? Number((prepared.optimizedBytes / prepared.originalBytes).toFixed(4)) : undefined,
        optimizationScope: "avatar",
        optimizationVersion: "pr5-upload-guardrails-v1",
        optimizationReason: prepared?.reason,
        width: prepared?.width,
        height: prepared?.height,
        fallbackUsed: prepared ? !buildOptimizationMeta(prepared, "pr5-upload-guardrails-v1") : true,
        compressionApplied: prepared?.compressionApplied ?? false,
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
        bio: bio.trim() || null,
        profileUrl: profileUrl.trim() || null,
        image: image || null,
        avatarFocusX,
        avatarFocusY,
        avatarZoom,
        gender: gender || null,
        birthMonth: birthMonth === "" ? null : birthMonth,
        birthYear: birthYear === "" ? null : birthYear,
      });
      await update();
      router.refresh();
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
        avatarOptimizationSummary={avatarOptimizationSummary}
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
          setAvatarOptimizationSummary(null);
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
        bio={bio}
        onBioChange={(v) => setBio(v.slice(0, 200))}
        profileUrl={profileUrl}
        onProfileUrlChange={setProfileUrl}
        gender={gender}
        onGenderChange={setGender}
        birthMonth={birthMonth}
        onBirthMonthChange={setBirthMonth}
        birthYear={birthYear}
        onBirthYearChange={setBirthYear}
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
