"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

type CommentUser = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
};

type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  isHidden?: boolean;
  user: CommentUser;
};

export default function CommentSection({ chapterId }: { chapterId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [canModerate, setCanModerate] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/comments`, { cache: "no-store" as any });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal memuat comments");
        setLoading(false);
        return;
      }
      setCanModerate(!!data?.canModerate);
      setComments((data?.comments || []) as CommentItem[]);
      setLoading(false);
    } catch {
      setError("Gagal memuat comments");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const pretty = useMemo(() => {
    return comments.map((c) => ({
      ...c,
      createdAtLabel: new Date(c.createdAt).toLocaleString(),
      displayName: c.user.name || c.user.username,
    }));
  }, [comments]);

  const submit = () => {
    setError(null);
    setUnauthorized(false);
    setInfo(null);
    const body = text.trim();
    if (!body) return;

    startTransition(async () => {
      const res = await fetch(`/api/chapters/${chapterId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal kirim comment");
        return;
      }
      setText("");
      await fetchComments();
      router.refresh();
    });
  };

  const toggleHide = (commentId: string, hide: boolean) => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch(`/api/comments/${commentId}/hide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hide }),
      });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal update comment");
        return;
      }
      setInfo(hide ? "Comment disembunyikan" : "Comment ditampilkan lagi");
      await fetchComments();
      router.refresh();
    });
  };

  const submitReport = async (commentId: string) => {
    setError(null);
    setInfo(null);
    setUnauthorized(false);
    const reason = reportReason.trim();
    if (!reason) {
      setError("Alasan report wajib diisi");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/reports`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType: "COMMENT", targetId: commentId, reason }),
      });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal kirim report");
        return;
      }
      setInfo("Report terkirim. Terima kasih!");
      setReportFor(null);
      setReportReason("");
    });
  };

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold">Comments</h2>
        <button
          onClick={fetchComments}
          className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-5">
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
            placeholder="Tulis comment..."
          />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-600 dark:text-gray-300">
              {unauthorized ? (
                <span>
                  Kamu belum login. <Link className="font-semibold text-purple-600 dark:text-purple-400 hover:underline" href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`}>Sign in</Link>
                </span>
              ) : null}
              {info ? <span className="text-emerald-700 dark:text-emerald-400">{info}</span> : null}
              {error ? <span className="text-red-600 dark:text-red-400">{error}</span> : null}
            </div>
            <button
              type="button"
              disabled={isPending || !text.trim()}
              onClick={submit}
              className="rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
            >
              {isPending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>

        <hr className="my-5 border-gray-200 dark:border-gray-800" />

        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading...</p>
        ) : pretty.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Belum ada comment.</p>
        ) : (
          <div className="space-y-4">
            {pretty.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{c.displayName}</div>
                  <div className="flex items-center gap-2">
                    {(c.isHidden ?? false) ? (
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold border border-amber-300/60 text-amber-700 dark:text-amber-300 dark:border-amber-500/40">
                        Hidden
                      </span>
                    ) : null}
                    <div className="text-xs text-gray-600 dark:text-gray-300">{c.createdAtLabel}</div>
                  </div>
                </div>

                <p className={`mt-2 text-sm whitespace-pre-line ${c.isHidden ? "text-gray-500 dark:text-gray-400" : "text-gray-700 dark:text-gray-200"}`}>
                  {c.isHidden ? "(Komentar ini disembunyikan oleh moderator)\n\n" + c.body : c.body}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReportFor((prev) => (prev === c.id ? null : c.id));
                      setReportReason("");
                      setError(null);
                      setInfo(null);
                    }}
                    className="rounded-full px-3 py-1 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    Report
                  </button>

                  {canModerate ? (
                    <button
                      type="button"
                      onClick={() => toggleHide(c.id, !(c.isHidden ?? false))}
                      className="rounded-full px-3 py-1 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      {(c.isHidden ?? false) ? "Unhide" : "Hide"}
                    </button>
                  ) : null}
                </div>

                {reportFor === c.id ? (
                  <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-3">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">Alasan report</div>
                    <input
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Misal: spam, hate speech, harassment..."
                      className="mt-2 w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReportFor(null);
                          setReportReason("");
                        }}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isPending || !reportReason.trim()}
                        onClick={() => submitReport(c.id)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
                      >
                        {isPending ? "Sending..." : "Submit"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
