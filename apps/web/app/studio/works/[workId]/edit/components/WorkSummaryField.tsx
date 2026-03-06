"use client";

export default function WorkSummaryField({
  description,
  setDescription,
}: {
  description: string;
  setDescription: (v: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">Summary</span>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={6}
        className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
      />
    </label>
  );
}
