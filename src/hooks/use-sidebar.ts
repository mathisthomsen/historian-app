"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sidebar-open";

export function useSidebar() {
  const [isOpen, setIsOpenState] = useState<boolean>(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsOpenState(stored === "true");
    }
  }, []);

  const setOpen = useCallback((value: boolean) => {
    setIsOpenState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const toggle = useCallback(() => {
    setIsOpenState((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { isOpen, setOpen, toggle };
}
