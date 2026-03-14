"use client";

import { useCallback, useEffect, useState } from "react";

import type { RelationTypeItem } from "@/types/relations";

interface UseRelationTypesResult {
  data: RelationTypeItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRelationTypes(projectId: string): UseRelationTypesResult {
  const [data, setData] = useState<RelationTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/relation-types?projectId=${encodeURIComponent(projectId)}`);
      if (!res.ok) {
        setError(`Failed to load relation types (${res.status})`);
        return;
      }
      const json = (await res.json()) as { data?: RelationTypeItem[] } | RelationTypeItem[];
      if (Array.isArray(json)) {
        setData(json);
      } else if (json && Array.isArray((json as { data?: RelationTypeItem[] }).data)) {
        setData((json as { data: RelationTypeItem[] }).data);
      }
    } catch {
      setError("Failed to load relation types");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchTypes();
  }, [fetchTypes]);

  return { data, isLoading, error, refetch: fetchTypes };
}
