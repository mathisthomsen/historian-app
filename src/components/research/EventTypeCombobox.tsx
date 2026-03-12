"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
import type { EventType } from "@/types/event-type";

interface EventTypeComboboxProps {
  projectId: string;
  value: string | null;
  onChange: (id: string | null) => void;
  onTypeCreated?: (type: EventType) => void;
}

export function EventTypeCombobox({
  projectId,
  value,
  onChange,
  onTypeCreated,
}: EventTypeComboboxProps) {
  const t = useTranslations("event_types");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "de";

  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<EventType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/event-types?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data: { data?: EventType[] } | EventType[]) => {
        if (Array.isArray(data)) {
          setTypes(data);
        } else if (data && Array.isArray((data as { data?: EventType[] }).data)) {
          setTypes((data as { data: EventType[] }).data);
        }
      })
      .catch(() => {
        /* silently fail */
      });
  }, [projectId]);

  const selected = types.find((t) => t.id === value) ?? null;

  const filtered = inputValue
    ? types.filter((t) => t.name.toLowerCase().includes(inputValue.toLowerCase()))
    : types;

  const exactMatch = types.some((t) => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  async function handleInlineCreate() {
    const name = inputValue.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/event-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, project_id: projectId }),
      });
      if (res.ok) {
        const newType = (await res.json()) as EventType;
        setTypes((prev) => [...prev, newType]);
        setNewlyCreatedId(newType.id);
        onChange(newType.id);
        onTypeCreated?.(newType);
        setOpen(false);
        setInputValue("");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.color && (
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: selected.color }}
                  />
                )}
                {selected.name}
              </span>
            ) : (
              <span className="text-muted-foreground">{t("fields.name")}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t("fields.name")}
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>{inputValue.trim() === "" ? t("fields.name") : null}</CommandEmpty>
              <CommandGroup>
                {filtered.map((type) => (
                  <CommandItem
                    key={type.id}
                    value={type.name}
                    onSelect={() => {
                      onChange(value === type.id ? null : type.id);
                      setOpen(false);
                      setInputValue("");
                    }}
                  >
                    <span className="flex flex-1 items-center gap-2">
                      {type.color && (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                      )}
                      {type.name}
                    </span>
                    {value === type.id && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
                {inputValue.trim() !== "" && !exactMatch && (
                  <CommandItem
                    value={`__create__${inputValue}`}
                    onSelect={handleInlineCreate}
                    disabled={creating}
                  >
                    {t("inline_create", { name: inputValue.trim() })}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {newlyCreatedId && (
        <p className="text-xs text-muted-foreground">
          <Link
            href={`/${locale}/settings/event-types`}
            className="underline hover:text-foreground"
          >
            {t("assign_color")} →
          </Link>
        </p>
      )}
    </div>
  );
}
