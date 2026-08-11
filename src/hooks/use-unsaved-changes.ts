"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UnsavedChangesGuard {
  /**
   * Wraps a navigation. Runs `action` immediately when the form is clean;
   * otherwise defers it behind the confirmation dialog.
   */
  guard: (action: () => void) => void;
  /** True while the confirmation dialog should be shown. */
  isConfirming: boolean;
  /** Runs the deferred action and closes the dialog. */
  confirmDiscard: () => void;
  /** Abandons the deferred action and closes the dialog. */
  cancelDiscard: () => void;
  /** For `onOpenChange` on the dialog. */
  setConfirming: (open: boolean) => void;
}

/**
 * Unsaved-changes protection for a form.
 *
 * A grep for `isDirty` / `beforeunload` / `unsaved` across src/ returned zero
 * hits: every form silently discarded everything to Cancel, browser Back, a
 * sidebar click or a refresh, with no warning, no draft and no undo. The
 * declared primary persona works 2–4 hour high-volume entry sessions, and on the
 * edit routes the discarded work is modification of an existing curated record
 * (issue #42).
 *
 * `beforeunload` covers refresh, tab close and external navigation; `guard`
 * covers in-app navigation the browser never learns about.
 */
export function useUnsavedChanges(isDirty: boolean): UnsavedChangesGuard {
  const [isConfirming, setIsConfirming] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      // The browser shows its own copy; preventDefault is what opts in.
      event.preventDefault();
      // Legacy browsers require a truthy returnValue.
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const guard = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action();
        return;
      }
      pendingAction.current = action;
      setIsConfirming(true);
    },
    [isDirty],
  );

  const confirmDiscard = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setIsConfirming(false);
    action?.();
  }, []);

  const cancelDiscard = useCallback(() => {
    pendingAction.current = null;
    setIsConfirming(false);
  }, []);

  const setConfirming = useCallback(
    (open: boolean) => {
      if (open) setIsConfirming(true);
      else cancelDiscard();
    },
    [cancelDiscard],
  );

  return { guard, isConfirming, confirmDiscard, cancelDiscard, setConfirming };
}
