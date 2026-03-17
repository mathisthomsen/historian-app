"use client";

import type { EntityType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ActivityEntry } from "@/types/relations";

interface ActivityLogProps {
  projectId: string;
  entityType: EntityType;
  entityId: string;
  refreshKey?: number;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min`;
  if (diffH < 24) return `vor ${diffH} Std`;
  if (diffD < 30) return `vor ${diffD} Tagen`;
  return date.toLocaleDateString("de");
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

const PAGE_SIZE = 20;

export function ActivityLog({ projectId, entityType, entityId, refreshKey }: ActivityLogProps) {
  const t = useTranslations("entityActivity");
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/entities/${entityType.toLowerCase()}/${entityId}/activity?projectId=${encodeURIComponent(projectId)}&page=${p}&limit=${PAGE_SIZE}`,
        );
        if (res.ok) {
          const data = (await res.json()) as {
            data?: ActivityEntry[];
            hasMore?: boolean;
          };
          const items = data.data ?? [];
          if (p === 1) {
            setEntries(items);
          } else {
            setEntries((prev) => [...prev, ...items]);
          }
          setHasMore(data.hasMore ?? items.length === PAGE_SIZE);
        }
      } finally {
        setLoading(false);
      }
    },
    [entityType, entityId, projectId],
  );

  useEffect(() => {
    setPage(1);
    void load(1);
  }, [load, refreshKey]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    void load(next);
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!loading && entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noActivity")}</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const displayName = entry.user_name ?? entry.agent_name ?? "System";
        const actionKey = entry.action as "CREATE" | "UPDATE" | "DELETE";
        const actionLabel = t(`actions.${actionKey}`);

        return (
          <div key={entry.id} className="flex gap-3">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{displayName}</span>{" "}
                <span className="text-muted-foreground">{actionLabel}</span>
                {entry.field_path && (
                  <span className="text-muted-foreground"> · {entry.field_path}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(entry.created_at)}
              </p>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <Button type="button" variant="outline" size="sm" onClick={loadMore} disabled={loading}>
          {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Mehr laden
        </Button>
      )}
    </div>
  );
}
