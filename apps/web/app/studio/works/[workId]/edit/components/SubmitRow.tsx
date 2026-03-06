"use client";

export default function SubmitRow({
  loading,
}: {
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="submit"
        disabled={loading}
        className="rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
