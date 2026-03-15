"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

import Link from "next/link";
import { useMemo, useState } from "react";
import ShareButton from "@/app/components/work/ShareButton";
import PublicUserLink from "@/app/components/user/PublicUserLink";
import ListOwnerControls from "./ownerControls";
import ListWorksGrid from "./listWorksGrid";

type ListLike = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  isPublic: boolean;
  owner?: { username?: string | null; name?: string | null } | null;
};

type Item = {
  id: string;
  work: any;
};

export default function ListPageShell({
  initialList,
  initialItems,
  isOwner,
}: {
  initialList: ListLike;
  initialItems: Item[];
  isOwner: boolean;
}) {
  const t = useUILanguageText();
  const [list, setList] = useState<ListLike>(initialList);
  const [items, setItems] = useState<Item[]>(initialItems);

  const itemCount = items.length;
  const empty = itemCount === 0;
  const ownerLabel = useMemo(() => list?.owner || null, [list]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight truncate">{list.title}</h1>
            <span
              className={
                "text-[11px] px-2 py-1 rounded-full " +
                (list.isPublic
                  ? "bg-emerald-600 text-white"
                  : "border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200")
              }
            >
              {list.isPublic ? "PUBLIC" : "PRIVATE"}
            </span>
          </div>

          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            by <b><PublicUserLink user={ownerLabel} className="hover:text-purple-400" /></b> • {itemCount} {t("Item") || "item"}
          </div>

          {list.description ? (
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{list.description}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ShareButton title={list.title} />
            <Link
              href="/lists"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              My lists
            </Link>
          </div>
        </div>

        {isOwner ? (
          <div className="w-full md:w-[360px]">
            <ListOwnerControls
              listId={list.id}
              initialTitle={list.title}
              initialDescription={list.description || ""}
              initialPublic={!!list.isPublic}
              onSaved={(nextList) => {
                setList((prev) => ({
                  ...prev,
                  title: nextList.title,
                  description: nextList.description || "",
                  isPublic: !!nextList.isPublic,
                }));
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-8">
        <ListWorksGrid listId={list.id} isOwner={isOwner} items={items} onItemsChange={setItems} />
      </div>

      {empty ? (
        <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-8">
          <div className="text-lg font-extrabold">Koleksi Masih Kosong</div>
          {isOwner ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Add works from the work page (using the “Add to List” button) or search for works via Search.
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">There is no work to show yet.</p>
          )}
          {isOwner ? (
            <div className="mt-4">
              <Link
                href="/search"
                className="inline-flex px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110"
              >
                Browse works
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
