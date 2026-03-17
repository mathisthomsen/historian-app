"use client";

import type { EntityType } from "@prisma/client";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EntityOption {
  id: string;
  label: string;
}

interface EntitySelectorProps {
  value: { type: EntityType; id: string } | null;
  onChange: (value: { type: EntityType; id: string; label: string } | null) => void;
  projectId: string;
  allowedTypes?: EntityType[];
  placeholder?: string;
  disabled?: boolean;
  displayLabel?: string;
}

const ALL_TYPES: EntityType[] = ["PERSON", "EVENT", "SOURCE"];

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  PERSON: "Person",
  EVENT: "Ereignis",
  SOURCE: "Quelle",
  LOCATION: "Ort",
  LITERATURE: "Literatur",
};

const ENTITY_API_PATH: Partial<Record<EntityType, string>> = {
  PERSON: "persons",
  EVENT: "events",
  SOURCE: "sources",
};

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function EntitySelector({
  value,
  onChange,
  projectId,
  allowedTypes,
  placeholder,
  disabled,
  displayLabel,
}: EntitySelectorProps) {
  const t = useTranslations("relationTypes");
  const availableTypes = allowedTypes ?? ALL_TYPES;
  const [selectedType, setSelectedType] = useState<EntityType>(availableTypes[0] ?? "PERSON");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntityOption[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const abortRef = useRef<AbortController | null>(null);

  // Resolve label for selected value
  const [selectedLabel, setSelectedLabel] = useState<string | null>(displayLabel ?? null);

  useEffect(() => {
    if (displayLabel) {
      setSelectedLabel(displayLabel);
      return;
    }
    if (!value) {
      setSelectedLabel(null);
      return;
    }
    // If we have a result in the current results list, use it
    const found = results.find((r) => r.id === value.id);
    if (found) {
      setSelectedLabel(found.label);
    }
  }, [value, results, displayLabel]);

  useEffect(() => {
    if (!open) return;
    if (debouncedQuery.length < 1) {
      setResults([]);
      return;
    }

    const apiPath = ENTITY_API_PATH[selectedType];
    if (!apiPath) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSearching(true);
    fetch(
      `/api/${apiPath}?q=${encodeURIComponent(debouncedQuery)}&projectId=${encodeURIComponent(projectId)}&limit=10`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((data: unknown) => {
        // Normalize response
        let items: EntityOption[] = [];
        const arr = Array.isArray(data)
          ? data
          : Array.isArray((data as { data?: unknown }).data)
            ? (data as { data: unknown[] }).data
            : [];
        items = arr.map((item: unknown) => {
          const rec = item as Record<string, unknown>;
          let label = "";
          if (selectedType === "PERSON") {
            label = [rec.first_name, rec.last_name].filter(Boolean).join(" ") || String(rec.id);
          } else if (selectedType === "EVENT") {
            label = String(rec.title ?? rec.id);
          } else if (selectedType === "SOURCE") {
            label = String(rec.title ?? rec.id);
          }
          return { id: String(rec.id), label };
        });
        setResults(items);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name !== "AbortError") {
          setResults([]);
        }
      })
      .finally(() => {
        setSearching(false);
      });
  }, [debouncedQuery, open, selectedType, projectId]);

  const displayPlaceholder = placeholder ?? "Entität auswählen…";

  function handleSelect(item: EntityOption) {
    setSelectedLabel(item.label);
    onChange({ type: selectedType, id: item.id, label: item.label });
    setOpen(false);
    setQuery("");
  }

  function handleClear() {
    onChange(null);
    setSelectedLabel(null);
  }

  if (value && selectedLabel) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1 text-sm">
          <span className="text-xs text-muted-foreground">{ENTITY_TYPE_LABELS[value.type]}</span>
          <span>{selectedLabel}</span>
        </Badge>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleClear}
            aria-label="Auswahl entfernen"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {availableTypes.length > 1 && (
        <select
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value as EntityType);
            setResults([]);
            setQuery("");
          }}
          disabled={disabled}
        >
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {t(`entityTypes.${type}`)}
            </option>
          ))}
        </select>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="min-w-[160px] justify-start text-muted-foreground"
            disabled={disabled}
          >
            {displayPlaceholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Suchen…" value={query} onValueChange={setQuery} />
            <CommandList>
              {searching && (
                <div className="py-2 text-center text-sm text-muted-foreground">Suche…</div>
              )}
              {!searching && query.length < 1 && (
                <div className="py-2 text-center text-sm text-muted-foreground">
                  Mindestens 1 Zeichen eingeben
                </div>
              )}
              {!searching && query.length >= 1 && results.length === 0 && (
                <CommandEmpty>Keine Ergebnisse.</CommandEmpty>
              )}
              {results.length > 0 && (
                <CommandGroup>
                  {results.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.label}
                      onSelect={() => handleSelect(item)}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
