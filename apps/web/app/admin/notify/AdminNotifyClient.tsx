"use client";

import * as React from "react";

export default function AdminNotifyClient() {
  const [to, setTo] = React.useState("@");
  const [title, setTitle] = React.useState("Admin message");
  const [message, setMessage] = React.useState("");
  const [href, setHref] = React.useState("/notifications");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!to.trim() || to.trim() === "@") {
      setError("Target user is required (ex: @username)");
      return;
    }
    if (!message.trim()) {
      setError("Message is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, title, message, href }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || "Failed");
      setOk(`Sent to ${to}`);
      setMessage("");
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/40 p-4 text-sm">
          {ok}
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="text-sm font-semibold">To (@username or email)</label>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          placeholder="@username"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          placeholder="Write your message to the user…"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold">Link (optional)</label>
        <input
          value={href}
          onChange={(e) => setHref(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          placeholder="/notifications"
        />
        <div className="text-xs text-gray-600 dark:text-gray-300">
          This is where the notification will take the user when clicked.
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send notification"}
        </button>
      </div>
    </form>
  );
}
