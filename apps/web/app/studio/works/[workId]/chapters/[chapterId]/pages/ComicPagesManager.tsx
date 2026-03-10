"use client";

import UploadPagesCard from "./components/UploadPagesCard";
import ChapterCoverCard from "./components/ChapterCoverCard";
import PagesGrid from "./components/PagesGrid";
import { useComicPagesManager } from "./components/useComicPagesManager";
import FloatingNotice from "@/app/components/ui/FloatingNotice";

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
    preparingFiles,
    uploadSummary,
    loading,
    err,
    setErr,
    pages: localPages,
    thumbnailImage: localThumbnailImage,
    replaceExisting,
    setReplaceExisting,
    upload,
    setThumb,
    clearThumb,
    del,
    move,
  } = useComicPagesManager({
    workId,
    chapterId,
    initialHasPages: pages.length > 0,
    initialPages: pages,
    initialThumbnailImage: thumbnailImage,
  });

  return (
    <div className="grid gap-4">
      <FloatingNotice open={!!err} title="Upload error" message={err || ""} onClose={() => setErr(null)} />

      <UploadPagesCard
        files={files}
        setFiles={setFiles}
        replaceExisting={replaceExisting}
        setReplaceExisting={setReplaceExisting}
        loading={loading}
        preparing={preparingFiles}
        summary={uploadSummary}
        onUpload={upload}
      />

      <ChapterCoverCard thumbnailImage={localThumbnailImage} loading={loading} onClear={clearThumb} />

      <PagesGrid workId={workId} pages={localPages} loading={loading} onUseAsCover={setThumb} onDelete={del} onMove={move} />
    </div>
  );
}
