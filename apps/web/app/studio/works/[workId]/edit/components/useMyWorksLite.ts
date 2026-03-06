"use client";

import * as React from "react";

export type WorkLite = { id: string; slug: string; title: string; type: string; status: string };

export function useMyWorksLite(excludeWorkId: string) {
  const [myWorks, setMyWorks] = React.useState<WorkLite[]>([]);
  const [loadingWorks, setLoadingWorks] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setLoadingWorks(true);
    fetch(`/api/studio/works`)
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        const works = Array.isArray(j?.works) ? (j.works as any[]) : [];
        const lite = works
          .map((w) => ({
            id: String(w.id),
            slug: String(w.slug || ""),
            title: String(w.title || ""),
            type: String(w.type || ""),
            status: String(w.status || ""),
          }))
          .filter((w) => w.id && w.slug && w.id !== excludeWorkId);
        setMyWorks(lite);
      })
      .catch(() => null)
      .finally(() => mounted && setLoadingWorks(false));
    return () => {
      mounted = false;
    };
  }, [excludeWorkId]);

  return { myWorks, loadingWorks };
}
