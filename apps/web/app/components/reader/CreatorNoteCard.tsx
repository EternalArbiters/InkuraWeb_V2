import * as React from "react";
import PublicUserLink from "@/app/components/user/PublicUserLink";

type Person = { username?: string | null; name?: string | null; image?: string | null };

function displayName(p: Person) {
  return (p.name && p.name.trim()) || (p.username && p.username.trim()) || "Unknown";
}

function avatarFallback(p: Person) {
  const t = displayName(p).trim();
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
  const uName = displayName(uploader);
  const tName = translator ? displayName(translator) : null;

  const roleLabel =
    publishType === "TRANSLATION" ? "Uploaded by" : publishType === "REUPLOAD" ? "Re-uploaded by" : "Uploaded by";

  return (
    <section className={compact ? "rounded-2xl border border-white/10 bg-black/20 p-4" : "rounded-2xl border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {uploader.image ? (
          <img src={uploader.image} alt={uName} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/80">
            {avatarFallback(uploader)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-xs text-white/60">{roleLabel}</div>
          <PublicUserLink
            user={uploader}
            className="block truncate font-semibold text-white hover:text-purple-200"
          >
            {uName}
          </PublicUserLink>

          {tName ? (
            <div className="mt-0.5 text-xs text-white/60">
              Translator:{" "}
              <PublicUserLink user={translator} className="text-white/80 hover:text-purple-200">
                {tName}
              </PublicUserLink>
            </div>
          ) : null}
        </div>
      </div>

      {note && note.trim() ? (
        <div className="mt-3 whitespace-pre-wrap text-sm text-white/85">{note}</div>
      ) : null}
    </section>
  );
}
