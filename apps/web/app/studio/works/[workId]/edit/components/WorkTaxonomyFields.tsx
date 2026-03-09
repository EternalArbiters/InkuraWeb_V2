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
      <MultiSelectPicker
        title="Genres"
        items={genres}
        selectedIds={genreIds}
        onChange={setGenreIds}
      />

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isMature}
            onChange={(e) => setIsMature(e.target.checked)}
          />
          <div>
            <div className="text-sm font-semibold">18+ / Mature</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Viewer wajib opt-in 18+. Centang dulu untuk membuka warning NSFW.
            </div>
          </div>
        </label>

        {isMature ? (
          <MultiSelectPicker
            title="Warnings"
            subtitle="NSFW / sensitive tags."
            items={warningTags}
            selectedIds={warningIds}
            onChange={setWarningIds}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-300">
            Aktifkan 18+ / Mature dulu kalau mau memilih warning NSFW.
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isDeviantLove}
              onChange={(e) => setIsDeviantLove(e.target.checked)}
            />
            <div>
              <div className="text-sm font-semibold">Deviant Love</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Tag khusus (butuh unlock). Jika tidak dicentang, tag DL akan dihapus.
              </div>
            </div>
          </label>
          {isDeviantLove ? (
            <div className="mt-4">
              <MultiSelectPicker
                title="Deviant Love Tags"
                items={deviantLoveTags}
                selectedIds={deviantLoveTagIds}
                onChange={setDeviantLoveTagIds}
              />
            </div>
          ) : null}
        </div>
      </div>

      <TagMultiInput label="Tags" value={tags} onChange={setTags} />
    </>
  );
}
