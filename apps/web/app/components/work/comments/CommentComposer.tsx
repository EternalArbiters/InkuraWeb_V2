"use client";

import { EyeOff, Image as ImageIcon, Link2, SendHorizonal } from "lucide-react";
import type { RefObject } from "react";

export default function CommentComposer({
  textareaRef,
  text,
  setText,
  files,
  onPickFiles,
  removeFileAt,
  applyHidden,
  insertLink,
  submit,
  isPending,
  filesLimit = 3,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  text: string;
  setText: (v: string) => void;
  files: File[];
  onPickFiles: (picked: FileList | null) => void;
  removeFileAt: (idx: number) => void;
  applyHidden: () => void;
  insertLink: () => void;
  submit: () => void;
  isPending: boolean;
  filesLimit?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
        placeholder="Write a comment..."
      />

      {/* Toolbar: keep Send pinned to the right (mobile-safe) */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 overflow-x-auto pr-2 no-scrollbar flex-nowrap">
            <button
              type="button"
              onClick={applyHidden}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
              title="Hidden (wrap selection with || ||)"
              aria-label="Hidden"
            >
              <EyeOff className="w-4 h-4" />
            </button>

            <label
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
              title="Attach image/GIF"
              aria-label="Attach image/GIF"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFiles(e.target.files)}
              />
              <ImageIcon className="w-4 h-4" />
            </label>

            <button
              type="button"
              onClick={insertLink}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
              title="Insert link"
              aria-label="Insert link"
            >
              <Link2 className="w-4 h-4" />
            </button>

            <span className="text-[11px] text-gray-600 dark:text-gray-300">({files.length}/{filesLimit})</span>
          </div>
        </div>

        <button
          type="button"
          disabled={isPending || !text.trim()}
          onClick={submit}
          className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
          aria-label="Send"
          title="Send"
        >
          <SendHorizonal className={`w-5 h-5 ${isPending ? "animate-pulse" : ""}`} />
        </button>
      </div>

      {files.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((f, idx) => {
            const url = URL.createObjectURL(f);
            return (
              <div key={idx} className="relative border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={f.name} className="w-20 h-20 object-cover block" />
                <button
                  type="button"
                  onClick={() => removeFileAt(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs font-bold"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
