"use client";

export default function WorkPublishTypeCard({ publishType }: { publishType: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-2">
      <div className="text-sm font-semibold">Publish type</div>
      <div className="text-xs text-gray-600 dark:text-gray-300"></div>
      <span className="inline-flex w-fit px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-semibold bg-gray-50 dark:bg-gray-900">
        {publishType}
      </span>
    </div>
  );
}
