"use client";

import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";

export default function DeviantLoveCard({
  warningTags = [],
  isMature = false,
  setIsMature,
  warningTagIds = [],
  setWarningTagIds,
  deviantLoveTags,
  isDeviantLove,
  setIsDeviantLove,
  deviantLoveTagIds,
  setDeviantLoveTagIds,
}: {
  warningTags?: PickerItem[];
  isMature?: boolean;
  setIsMature?: (v: boolean) => void;
  warningTagIds?: string[];
  setWarningTagIds?: (v: string[]) => void;
  deviantLoveTags: PickerItem[];
  isDeviantLove: boolean;
  setIsDeviantLove: (v: boolean) => void;
  deviantLoveTagIds: string[];
  setDeviantLoveTagIds: (v: string[]) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-4">
      {setIsMature ? (
        <>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isMature}
              onChange={(e) => setIsMature(e.target.checked)}
            />
            <div>
              <div className="text-sm font-semibold">18+ / Mature</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Viewer wajib opt-in 18+.
              </div>
            </div>
          </label>

          {isMature ? (
            <MultiSelectPicker
              title="Warnings"
              subtitle="NSFW / sensitive tags."
              items={warningTags}
              selectedIds={warningTagIds}
              onChange={setWarningTagIds || (() => undefined)}
            />
          ) : null}
        </>
      ) : null}

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
        <MultiSelectPicker
          title="Deviant Love Tags"
          items={deviantLoveTags}
          selectedIds={deviantLoveTagIds}
          onChange={setDeviantLoveTagIds}
        />
      ) : null}
    </div>
  );
}
