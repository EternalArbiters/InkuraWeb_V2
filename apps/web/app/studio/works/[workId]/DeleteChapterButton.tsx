"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type Props = {
  chapterId: string;
  chapterTitle: string;
};

export default function DeleteChapterButton({ chapterId, chapterTitle }: Props) {
  const router = useRouter();
  const t = useUILanguageText("Page Studio");
  const [loading, setLoading] = React.useState(false);

  const onDelete = async () => {
    const ok = window.confirm(
      t('Delete "{title}"? This will remove the chapter and its related data. This cannot be undone.').replace("{title}", chapterTitle)
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/studio/chapters/${chapterId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || t("Delete failed"));
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("Delete failed");
      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-gray-900"
      title={t("Delete chapter")}
      aria-label={t("Delete chapter")}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
