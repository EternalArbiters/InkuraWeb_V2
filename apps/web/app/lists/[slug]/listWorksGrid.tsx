"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import WorkCoverBadges from "@/app/components/WorkCoverBadges";
import { X } from "lucide-react";

type Item = {
  id: string;
  work: any;
};

export default function ListWorksGrid({ listId, isOwner, items }: { listId: string; isOwner: boolean; items: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = async (workId: string) => {
    startTransition(async () => {
      try {
        await fetch(`/api/lists/${listId}/items/${workId}`, { method: "DELETE" });
        router.refresh();
      } catch {
        // ignore
      }
    });
  };

  const works = items.map((it) => it.work).filter(Boolean);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {works.map((w: any) => {
        const authorName = w.author?.name || w.author?.username || "Unknown";
        return (
          <div key={w.id} className="relative group border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 overflow-hidden hover:shadow-lg transition">
            {isOwner ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(w.id)}
                className="absolute z-10 top-2 right-2 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                aria-label="Remove from list"
                title="Remove"
              >
                <X size={18} />
              </button>
            ) : null}

            <Link href={`/w/${w.slug}`} className="block">
              <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {w.coverImage ? <img src={w.coverImage} alt={w.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition" /> : null}
                <WorkCoverBadges
                  work={{
                    type: w.type,
                    publishType: w.publishType,
                    isMature: !!w.isMature,
                    language: w.language,
                    comicType: w.comicType,
                    updatedAt: w.updatedAt,
                  }}
                />
              </div>
              <div className="p-3">
                <div className="text-sm font-bold leading-snug line-clamp-2">{w.title}</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-1">Up by {authorName}</div>
                <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-3">
                  <span>❤ {w.likeCount ?? 0}</span>
                  <span>
                    ⭐ {(Math.round((w.ratingAvg ?? 0) * 10) / 10).toFixed(1)} ({w.ratingCount ?? 0})
                  </span>
                </div>
              </div>
            </Link>
          </div>
        );
      })}

      {works.length === 0 ? (
        <div className="col-span-2 md:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <div className="text-lg font-bold">No works</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Work di list ini tidak bisa ditampilkan untuk viewer saat ini.</p>
        </div>
      ) : null}
    </div>
  );
}
