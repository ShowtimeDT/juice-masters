"use client";

import { useEffect, type RefObject } from "react";

/** Calls onOutside when a click lands outside the ref'd element. */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  active: boolean
) {
  useEffect(() => {
    if (!active) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside, active]);
}
