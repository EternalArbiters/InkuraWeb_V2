"use client";

import UploadPagesCard from "./components/UploadPagesCard";
import ChapterCoverCard from "./components/ChapterCoverCard";
import PagesGrid from "./components/PagesGrid";
import { useComicPagesManager } from "./components/useComicPagesManager";

type Page = { id: string; imageUrl: string; order: number };

type Props = {
  workId: string;
  chapterId: string;
  pages: Page[];
  thumbnailImage: string | null;
};

export default function ComicPagesManager({ workId, chapterId, pages, thumbnailImage }: Props) {
  const {
    files,
    setFiles,
    loading,
    err,
    replaceExisting,
    setReplaceExisting,
    upload,
    setThumb,
    clearThumb,
    del,
  } = useComicPagesManager({ workId, chapterId, initialHasPages: pages.length > 0 });

  return (
    <div className="grid gap-4">
      {err ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">
          {err}
        </div>
      ) : null}

      <UploadPagesCard
        files={files}
        setFiles={setFiles}
        replaceExisting={replaceExisting}
        setReplaceExisting={setReplaceExisting}
        loading={loading}
        onUpload={() => upload(pages.length)}
      />

      <ChapterCoverCard
        thumbnailImage={thumbnailImage}
        loading={loading}
        onClear={clearThumb}
      />

      <PagesGrid
        workId={workId}
        pages={pages}
        loading={loading}
        onUseAsCover={setThumb}
        onDelete={del}
      />
    </div>
  );
}
