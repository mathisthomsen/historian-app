"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

/**
 * Page-scoped row selection for the entity list tables.
 *
 * Selection is deliberately *not* carried across a page / search / sort / filter
 * change. `DataTable`'s select-all has always operated on the visible page only,
 * so a selection that outlived a param change left the header checkbox describing
 * one page while holding another page's ids — and a bulk delete could then destroy
 * rows the user could not see, with a confirmation count they had no way to
 * reconcile against the screen (issue #39).
 *
 * The reset happens during render rather than in an effect so the stale selection
 * is never painted, and never reaches the bulk bar or its confirmation dialog.
 */
export function useRowSelection(): [string[], (ids: string[]) => void] {
  const searchParams = useSearchParams();
  const listKey = searchParams.toString();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const lastListKey = useRef(listKey);

  if (lastListKey.current !== listKey) {
    lastListKey.current = listKey;
    if (selectedIds.length > 0) {
      setSelectedIds([]);
      return [[], setSelectedIds];
    }
  }

  return [selectedIds, setSelectedIds];
}
