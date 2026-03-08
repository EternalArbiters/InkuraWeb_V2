"use client";

import * as React from "react";
import { getOrFetchClientResource } from "@/lib/clientResourceCache";

export type WorkLite = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  seriesTitle?: string | null;
  seriesOrder?: number | null;
  coverImage?: string | null;
};

const MY_WORKS_CACHE_KEY = "studio:my-works-lite";

export function useMyWorksLite(excludeWorkId: string) {
  const [myWorks, setMyWorks] = React.useState<WorkLite[]>([]);
  const [loadingWorks, setLoadingWorks] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setLoadingWorks(true);
    getOrFetchClientResource<WorkLite[]>(
      MY_WORKS_CACHE_KEY,
      async () => {
        const response = await fetch(`/api/studio/works`);
        const json = await response.json().catch(() => ({} as any));
        const works = Array.isArray(json?.works) ? (json.works as any[]) : [];
        return works.map((w) => ({
          id: String(w.id),
          slug: String(w.slug || ""),
          title: String(w.title || ""),
          type: String(w.type || ""),
          status: String(w.status || ""),
          seriesTitle: w?.series?.title ? String(w.series.title) : null,
          seriesOrder: typeof w?.seriesOrder === "number" ? w.seriesOrder : null,
          coverImage: typeof w?.coverImage === "string" ? w.coverImage : null,
        }));
      },
      { ttlMs: 30_000 }
    )
      .then((works) => {
        if (!mounted) return;
        setMyWorks(works.filter((work) => work.id && work.slug && work.id !== excludeWorkId));
      })
      .catch(() => null)
      .finally(() => mounted && setLoadingWorks(false));
    return () => {
      mounted = false;
    };
  }, [excludeWorkId]);

  return { myWorks, loadingWorks };
}
