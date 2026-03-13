"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { EyeOff } from "lucide-react";
import { normalizeUrl, parseHiddenInline } from "./textUtils";

function renderUrls(seg: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(seg))) {
    const rawMatch = m[0];
    const start = m.index;
    const end = start + rawMatch.length;

    if (start > cursor) out.push(seg.slice(cursor, start));

    // Trim common trailing punctuation
    let raw = rawMatch;
    let trailing = "";
    while (raw.length && /[\]\[\)\}\.,!?:;]$/.test(raw)) {
      trailing = raw.slice(-1) + trailing;
      raw = raw.slice(0, -1);
    }

    const href = normalizeUrl(raw);
    out.push(
      <a
        key={`${keyBase}-url-${start}-${end}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-purple-600 dark:text-purple-400 hover:underline break-words"
      >
        {raw}
      </a>
    );
    if (trailing) out.push(trailing);
    cursor = end;
  }
  if (cursor < seg.length) out.push(seg.slice(cursor));
  return out;
}

function renderTextWithLinks(text: string, keyBase: string): ReactNode[] {
  // Supports bare URLs + simple markdown links: [text](https://...)
  const out: ReactNode[] = [];
  const mdLink = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = mdLink.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > cursor) out.push(...renderUrls(text.slice(cursor, start), `${keyBase}-pre-${cursor}-${start}`));

    const label = m[1];
    const url = m[2];
    out.push(
      <a
        key={`${keyBase}-md-${start}-${end}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-purple-600 dark:text-purple-400 hover:underline break-words"
      >
        {label}
      </a>
    );
    cursor = end;
  }
  if (cursor < text.length) out.push(...renderUrls(text.slice(cursor), `${keyBase}-tail-${cursor}`));
  return out;
}

export default function CommentBody({ body, className }: { body: string; className?: string }) {
  const tokens = useMemo(() => parseHiddenInline(body), [body]);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  return (
    <div data-ui-language-ignore="true" className={className || ""} style={{ whiteSpace: "pre-wrap" }}>
      {tokens.map((t, idx) => {
        if (t.type === "text") {
          return <span key={idx}>{renderTextWithLinks(t.value, `t-${idx}`)}</span>;
        }

        const shown = !!open[idx];
        if (!shown) {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setOpen((p) => ({ ...p, [idx]: true }))}
              className="inline-flex items-center gap-1 align-baseline mx-0.5 px-2 py-0.5 rounded-md border border-purple-300/60 dark:border-purple-500/40 bg-purple-50/70 dark:bg-purple-950/25 text-[12px] font-semibold text-purple-700 dark:text-purple-300 hover:brightness-95"
              title="Tap to reveal"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Hidden
            </button>
          );
        }

        return (
          <span
            key={idx}
            onClick={() => setOpen((p) => ({ ...p, [idx]: false }))}
            className="inline rounded-md px-1 bg-purple-50/60 dark:bg-purple-950/25 cursor-pointer"
            title="Tap to hide"
          >
            {renderTextWithLinks(t.value, `h-${idx}`)}
          </span>
        );
      })}
    </div>
  );
}
