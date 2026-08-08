"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface UseListUrlStateOptions {
  /** Current sort key, used to decide whether a sort click toggles direction. */
  sort?: string | undefined;
  /** Current sort direction. */
  order?: string | undefined;
}

export interface ListUrlState {
  /** Builds a query string from the current params plus `params`. Empty values delete the key. */
  buildUrl: (params: Record<string, string>) => string;
  /** Navigates with `params` merged into the current query. */
  push: (params: Record<string, string>) => void;
  /** Sets `search` and returns to page 1. */
  handleSearch: (value: string) => void;
  /** Toggles asc/desc when re-clicking the active column, else sorts ascending. Resets to page 1. */
  handleSort: (key: string) => void;
  /** Navigates to `newPage`, preserving all other params. */
  handlePageChange: (newPage: number) => void;
}

/**
 * URL-param list state shared by the entity list clients (audit F-M2 / X-M4).
 *
 * buildUrl, handleSearch, handleSort and handlePageChange were duplicated
 * verbatim across PersonsListClient, EventsListClient and SourceTable — each
 * carrying the same `eslint-disable react-hooks/exhaustive-deps`, which the
 * audit called out as a sign the dependencies were wrong in all three. They are
 * correct here: every callback depends only on the router, the current params,
 * and the current sort, all of which are in the dependency arrays.
 */
export function useListUrlState({ sort, order }: UseListUrlStateOptions = {}): ListUrlState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const buildUrl = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(search);
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      }
      return `?${current.toString()}`;
    },
    [search],
  );

  const push = useCallback(
    (params: Record<string, string>) => {
      router.push(buildUrl(params));
    },
    [router, buildUrl],
  );

  const handleSearch = useCallback(
    (value: string) => {
      push({ search: value, page: "1" });
    },
    [push],
  );

  const handleSort = useCallback(
    (key: string) => {
      const newOrder = sort === key && order === "asc" ? "desc" : "asc";
      push({ sort: key, order: newOrder, page: "1" });
    },
    [push, sort, order],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      push({ page: String(newPage) });
    },
    [push],
  );

  return useMemo(
    () => ({ buildUrl, push, handleSearch, handleSort, handlePageChange }),
    [buildUrl, push, handleSearch, handleSort, handlePageChange],
  );
}
