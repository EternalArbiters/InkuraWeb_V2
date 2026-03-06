"use client";

import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";

export default function DeviantLoveCard({
  deviantLoveTags,
  isDeviantLove,
  setIsDeviantLove,
  deviantLoveTagIds,
  setDeviantLoveTagIds,
}: {
  deviantLoveTags: PickerItem[];
  isDeviantLove: boolean;
  setIsDeviantLove: (v: boolean) => void;
  deviantLoveTagIds: string[];
  setDeviantLoveTagIds: (v: string[]) => void;
}) {
  return (
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
            Tag khusus (butuh unlock).
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
  );
}
