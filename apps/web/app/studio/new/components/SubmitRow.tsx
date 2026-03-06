"use client";

export default function SubmitRow({ loading }: { loading: boolean }) {
  return (
    <div className="flex items-center justify-end">
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create"}
      </button>
    </div>
  );
}
