"use client";

import * as React from "react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import PublicUserLink from "@/app/components/user/PublicUserLink";

type Person = { username?: string | null; name?: string | null; image?: string | null };

function rawDisplayName(p: Person) {
  return (p.name && p.name.trim()) || (p.username && p.username.trim()) || "Unknown";
}

function avatarFallback(p: Person) {
  const t = rawDisplayName(p).trim();
  return t ? t[0].toUpperCase() : "U";
}

export default function CreatorNoteCard({
  uploader,
  translator,
  publishType,
  note,
  compact = false,
}: {
  uploader: Person;
  translator?: Person | null;
  publishType?: string | null;
  note?: string | null;
  compact?: boolean;
}) {
  const t = useUILanguageText();
  const uName = uploader.name?.trim() || uploader.username?.trim() || t("Unknown");
  const tName = translator ? translator.name?.trim() || translator.username?.trim() || t("Unknown") : null;

  const roleLabel =
    publishType === "TRANSLATION"
      ? t("Uploaded by")
      : publishType === "REUPLOAD"
        ? t("Re-uploaded by")
        : t("Uploaded by");

  return (
    <section
      data-reader-uploader-card
      className={compact ? "rounded-2xl border border-white/10 bg-black/20 p-4" : "rounded-2xl border border-white/10 bg-black/20 p-4"}
    >
      <div className="flex items-center gap-3">
        {uploader.image ? (
          <img src={uploader.image} alt={uName} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/80">
            {avatarFallback(uploader)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div data-reader-uploader-label className="text-xs text-white/60">{roleLabel}</div>
          <div data-reader-uploader-name>
            <PublicUserLink
              user={uploader}
              className="block truncate font-semibold text-white hover:text-purple-200"
            >
              {uName}
            </PublicUserLink>
          </div>

          {tName ? (
            <div data-reader-uploader-meta className="mt-0.5 text-xs text-white/60">
              {t("Translator")}:{" "}
              <span data-reader-uploader-link>
                <PublicUserLink user={translator} className="text-white/80 hover:text-purple-200">
                  {tName}
                </PublicUserLink>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {note && note.trim() ? <div className="mt-3 whitespace-pre-wrap text-sm text-white/85">{note}</div> : null}
    </section>
  );
}
