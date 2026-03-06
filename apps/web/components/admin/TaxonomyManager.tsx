"use client";

import TaxonomyManagerInner from "./taxonomyManager/TaxonomyManagerInner";
import type { Kind } from "./taxonomyManager/types";

export default function TaxonomyManager({ kind, title }: { kind: Kind; title: string }) {
  return <TaxonomyManagerInner kind={kind} title={title} />;
}
