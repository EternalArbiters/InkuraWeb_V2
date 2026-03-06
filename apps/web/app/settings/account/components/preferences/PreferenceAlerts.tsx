"use client";

type Props = {
  err: string | null;
  msg: string | null;
};

export default function PreferenceAlerts({ err, msg }: Props) {
  return (
    <>
      {err ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">{err}</div>
      ) : null}
      {msg ? (
        <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/40 p-4 text-sm">{msg}</div>
      ) : null}
    </>
  );
}
