"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const KEY = "thriftshark.bag";
const CHANGED = "thriftshark:bag-changed";
const EMPTY: number[] = [];

/**
 * The bag lives in localStorage, which makes it an external store: reading it
 * through useSyncExternalStore keeps React in sync across tabs without an
 * effect, and gives a stable empty value during server render and hydration.
 */
let cachedRaw: string | null = null;
let cachedIds: number[] = EMPTY;

function parse(raw: string | null): number[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const ids = [...new Set(parsed.filter((n: unknown) => Number.isInteger(n)))] as number[];
    return ids.length === 0 ? EMPTY : ids;
  } catch {
    return EMPTY;
  }
}

/** Must return a referentially stable value when nothing changed. */
function getSnapshot(): number[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Private mode or blocked storage: behave as an empty bag.
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedIds = parse(raw);
  }
  return cachedIds;
}

function getServerSnapshot(): number[] {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  // "storage" covers other tabs; the custom event covers this one.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

function write(ids: number[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Nothing persisted, but the event below still refreshes the UI.
  }
  window.dispatchEvent(new Event(CHANGED));
}

export function useCart() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // False during server render and the first client render, true afterwards,
  // so callers can tell "empty bag" apart from "not read yet".
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const add = useCallback((id: number) => {
    const current = getSnapshot();
    if (!current.includes(id)) write([...current, id]);
  }, []);

  const remove = useCallback((id: number) => {
    write(getSnapshot().filter((n) => n !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  return useMemo(
    () => ({ ids, ready, has: (id: number) => ids.includes(id), add, remove, clear }),
    [ids, ready, add, remove, clear],
  );
}
