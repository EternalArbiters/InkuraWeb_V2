"use client";

import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";
import TagMultiInput from "@/components/TagMultiInput";

export default function WorkTaxonomyFields({
  genres,
  genreIds,
  setGenreIds,
  warningTags,
  warningIds,
  setWarningIds,
  isMature,
  setIsMature,
  deviantLoveTags,
  isDeviantLove,
  setIsDeviantLove,
  deviantLoveTagIds,
  setDeviantLoveTagIds,
  tags,
  setTags,
}: {
  genres: PickerItem[];
  genreIds: string[];
  setGenreIds: (v: string[]) => void;
  warningTags: PickerItem[];
  warningIds: string[];
  setWarningIds: (v: string[]) => void;
  isMature: boolean;
  setIsMature: (v: boolean) => void;
  deviantLoveTags: PickerItem[];
  isDeviantLove: boolean;
  setIsDeviantLove: (v: boolean) => void;
  deviantLoveTagIds: string[];
  setDeviantLoveTagIds: (v: string[]) => void;
  tags: string[];
  setTags: (v: string[]) => void;
}) {
  return (
    <>
      <MultiSelectPicker title="Genres" items={genres} selectedIds={genreIds} onChange={setGenreIds} />

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={isMature} onChange={(e) => setIsMature(e.target.checked)} />
          <div>
            <div className="text-sm font-semibold">18+ / Mature</div>
          </div>
        </label>

        {isMature ? (
          <MultiSelectPicker
            title="Warnings"
            items={warningTags}
            selectedIds={warningIds}
            onChange={setWarningIds}
          />
        ) : null}

        <label className="flex items-center gap-3">
          <input type="checkbox" checked={isDeviantLove} onChange={(e) => setIsDeviantLove(e.target.checked)} />
          <div>
            <div className="text-sm font-semibold">Deviant Love</div>
          </div>
        </label>

        {isDeviantLove ? (
          <MultiSelectPicker
            title="Deviant Love Tags"
            items={deviantLoveTags}
            selectedIds={deviantLoveTagIds}
            onChange={setDeviantLoveTagIds}
          />
        ) : null}
      </div>

      <TagMultiInput label="Tags" value={tags} onChange={setTags} />
    </>
  );
}
