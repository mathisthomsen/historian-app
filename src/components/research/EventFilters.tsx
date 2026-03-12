"use client";

import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DateRangeFilterInfo } from "@/components/research/DateRangeFilterInfo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { EventFilterState } from "@/types/event";
import type { EventType } from "@/types/event-type";

interface EventFiltersProps {
  typeIds: string[];
  fromYear: number | null;
  toYear: number | null;
  topLevelOnly: boolean;
  availableTypes: EventType[];
  onChange: (filters: EventFilterState) => void;
}

export function EventFilters({
  typeIds,
  fromYear,
  toYear,
  topLevelOnly,
  availableTypes,
  onChange,
}: EventFiltersProps) {
  const t = useTranslations("events.list");
  const [typeOpen, setTypeOpen] = useState(false);

  function toggleType(id: string) {
    const newIds = typeIds.includes(id) ? typeIds.filter((x) => x !== id) : [...typeIds, id];
    onChange({ typeIds: newIds, fromYear, toYear, topLevelOnly });
  }

  function handleFromYear(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
    onChange({ typeIds, fromYear: isNaN(val as number) ? null : val, toYear, topLevelOnly });
  }

  function handleToYear(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
    onChange({ typeIds, fromYear, toYear: isNaN(val as number) ? null : val, topLevelOnly });
  }

  function handleTopLevelOnly(checked: boolean | "indeterminate") {
    onChange({ typeIds, fromYear, toYear, topLevelOnly: checked === true });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Type multi-select */}
      <Popover open={typeOpen} onOpenChange={setTypeOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-1">
            {t("type_filter_label")}
            {typeIds.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 rounded-full px-1.5 text-xs">
                {typeIds.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            {availableTypes.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">—</p>
            ) : (
              availableTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggleType(type.id)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded border border-input">
                    {typeIds.includes(type.id) && <Check className="h-3 w-3" />}
                  </span>
                  {type.color && (
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                  )}
                  <span className="flex-1 truncate text-left">{type.name}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Year range */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          placeholder={t("date_range_from")}
          aria-label={t("date_range_from")}
          value={fromYear ?? ""}
          onChange={handleFromYear}
          className="h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="number"
          placeholder={t("date_range_to")}
          aria-label={t("date_range_to")}
          value={toYear ?? ""}
          onChange={handleToYear}
          className="h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <DateRangeFilterInfo />
      </div>

      {/* Top-level only checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox id="top-level-only" checked={topLevelOnly} onCheckedChange={handleTopLevelOnly} />
        <Label htmlFor="top-level-only" className="cursor-pointer text-sm">
          {t("top_level_only")}
        </Label>
      </div>
    </div>
  );
}
