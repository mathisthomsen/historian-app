"use client";

import { Loader2, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EventTypeColorPicker } from "@/components/research/EventTypeColorPicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EventType } from "@/types/event-type";

type EditState = { id: string; name: string; color: string | null } | null;

interface EventTypeSettingsTableProps {
  projectId: string;
}

export function EventTypeSettingsTable({ projectId }: EventTypeSettingsTableProps) {
  const t = useTranslations("event_types");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "de";

  const [types, setTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editState, setEditState] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EventType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string | null>(null);
  const [savingNew, setSavingNew] = useState(false);

  useEffect(() => {
    void loadTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadTypes() {
    setLoading(true);
    try {
      const res = await fetch(`/api/event-types?projectId=${projectId}`);
      if (res.ok) {
        const data = (await res.json()) as { data?: EventType[] } | EventType[];
        if (Array.isArray(data)) {
          setTypes(data);
        } else if ((data as { data?: EventType[] }).data) {
          setTypes((data as { data: EventType[] }).data);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!editState) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/event-types/${editState.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editState.name, color: editState.color }),
      });
      if (res.ok) {
        const updated = (await res.json()) as EventType;
        setTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditState(null);
        toast.success(t("saved_toast"));
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? t("saved_toast"));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(type: EventType) {
    if (type.event_count > 0) {
      toast(t("in_use_toast", { count: type.event_count }), {
        action: {
          label: t("view_events"),
          onClick: () => {
            window.location.href = `/${locale}/events?typeIds=${type.id}`;
          },
        },
      });
      return;
    }
    setDeleteTarget(type);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/event-types/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setTypes((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast.success(t("deleted_toast"));
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? t("deleted_toast"));
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleCreateNew() {
    if (!newName.trim()) return;
    setSavingNew(true);
    try {
      const res = await fetch("/api/event-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor, project_id: projectId }),
      });
      if (res.ok) {
        const created = (await res.json()) as EventType;
        setTypes((prev) => [created, ...prev]);
        setCreating(false);
        setNewName("");
        setNewColor(null);
        toast.success(t("saved_toast"));
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? t("saved_toast"));
      }
    } finally {
      setSavingNew(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          {t("create")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">{t("fields.color")}</TableHead>
            <TableHead>{t("fields.name")}</TableHead>
            <TableHead className="w-20 text-right">{t("fields.event_count")}</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Inline create row */}
          {creating && (
            <TableRow>
              <TableCell>
                <EventTypeColorPicker value={newColor} onChange={setNewColor} />
              </TableCell>
              <TableCell colSpan={2}>
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("fields.name")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleCreateNew();
                    }
                    if (e.key === "Escape") {
                      setCreating(false);
                      setNewName("");
                      setNewColor(null);
                    }
                  }}
                  disabled={savingNew}
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateNew}
                    disabled={savingNew || !newName.trim()}
                  >
                    {savingNew && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    {t("save")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCreating(false);
                      setNewName("");
                      setNewColor(null);
                    }}
                    disabled={savingNew}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}

          {types.map((type) =>
            editState?.id === type.id ? (
              <TableRow key={type.id}>
                <TableCell>
                  <EventTypeColorPicker
                    value={editState.color}
                    onChange={(hex) => setEditState((prev) => prev && { ...prev, color: hex })}
                  />
                </TableCell>
                <TableCell colSpan={2}>
                  <Input
                    autoFocus
                    value={editState.name}
                    onChange={(e) =>
                      setEditState((prev) => prev && { ...prev, name: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSaveEdit();
                      }
                      if (e.key === "Escape") setEditState(null);
                    }}
                    disabled={saving}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={saving || !editState.name.trim()}
                    >
                      {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      {t("save")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditState(null)}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow key={type.id}>
                <TableCell>
                  {type.color ? (
                    <span
                      className="inline-block h-5 w-5 rounded-full border border-border"
                      style={{ backgroundColor: type.color }}
                    />
                  ) : (
                    <span className="inline-block h-5 w-5 rounded-full border border-dashed border-border" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {type.event_count > 0 ? (
                    <Link
                      href={`/${locale}/events?typeIds=${type.id}`}
                      className="underline hover:text-foreground"
                    >
                      {type.event_count}
                    </Link>
                  ) : (
                    0
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label="Edit"
                      onClick={() =>
                        setEditState({ id: type.id, name: type.name, color: type.color })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label="Delete"
                      onClick={() => handleDelete(type)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ),
          )}

          {types.length === 0 && !creating && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                —
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("delete_confirm_title", { name: deleteTarget?.name ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("delete_confirm_body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("delete_action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
