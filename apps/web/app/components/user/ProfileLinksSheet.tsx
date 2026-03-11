"use client";

import { ExternalLink, Link2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { displayUrlLabel, type ProfileLinkEntry } from "@/lib/profileUrls";

function secondaryLabel(links: ProfileLinkEntry[]) {
  if (!links.length) return "";
  if (links.length === 1) return displayUrlLabel(links[0].url);
  return `+${links.length - 1} more`;
}

export default function ProfileLinksSheet({
  links,
  triggerClassName = "",
}: {
  links: ProfileLinkEntry[];
  triggerClassName?: string;
}) {
  if (!links.length) return null;

  const primary = links[0];
  const secondary = secondaryLabel(links);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`inline-flex max-w-full items-start gap-2 text-left text-sm font-semibold text-purple-600 transition hover:text-purple-500 dark:text-purple-300 dark:hover:text-purple-200 ${triggerClassName}`}
        >
          <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">
            <span className="block break-words">{primary.title}</span>
            <span className="mt-0.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{secondary}</span>
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="!top-auto !bottom-0 !translate-y-0 max-w-2xl rounded-t-[28px] rounded-b-none border-gray-200 bg-white px-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-0 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-gray-300 dark:bg-gray-700" />
        <DialogHeader className="px-5 pt-4 text-left">
          <DialogTitle className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Tautan</DialogTitle>
        </DialogHeader>

        <div className="mt-4 max-h-[70vh] overflow-y-auto px-3 pb-2">
          <div className="grid gap-2">
            {links.map((link) => (
              <a
                key={`${link.title}:${link.url}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 rounded-3xl border border-gray-200 bg-white/80 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/70 dark:hover:bg-gray-900"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                  <Link2 className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-gray-900 dark:text-white">{link.title}</span>
                  <span className="mt-0.5 block truncate text-sm text-gray-500 dark:text-gray-400">{displayUrlLabel(link.url)}</span>
                </span>
                <ExternalLink className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
              </a>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
