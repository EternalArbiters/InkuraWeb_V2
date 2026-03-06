"use client";

import * as React from "react";

import ThumbCropper from "@/app/components/ThumbCropper";

type Props = {
  initialEmail: string;

  avatar: string | null;
  avatarUploading: boolean;

  avatarFocusX: number;
  setAvatarFocusX: (v: number) => void;
  avatarFocusY: number;
  setAvatarFocusY: (v: number) => void;
  avatarZoom: number;
  setAvatarZoom: (v: number) => void;

  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
};

export default function AvatarPickerCard({
  initialEmail,
  avatar,
  avatarUploading,
  avatarFocusX,
  setAvatarFocusX,
  avatarFocusY,
  setAvatarFocusY,
  avatarZoom,
  setAvatarZoom,
  fileInputRef,
  onAvatarChange,
  onRemoveImage,
}: Props) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="w-24 max-w-[120px]">
          <ThumbCropper
            src={avatar || null}
            aspect={1}
            cropShape="round"
            maxZoom={6}
            value={{ focusX: avatarFocusX, focusY: avatarFocusY, zoom: avatarZoom }}
            onChange={(v) => {
              setAvatarFocusX(v.focusX);
              setAvatarFocusY(v.focusY);
              setAvatarZoom(v.zoom);
            }}
            disabled={avatarUploading}
            onPickImage={() => fileInputRef.current?.click()}
            onRemoveImage={onRemoveImage}
            className="max-w-[120px]"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-gray-500 dark:text-gray-400">Signed in as</div>
          <div className="font-semibold text-gray-900 dark:text-white truncate">{initialEmail}</div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onAvatarChange}
      />
    </>
  );
}
