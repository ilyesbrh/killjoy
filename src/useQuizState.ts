import { useState, useEffect, useCallback } from "react";

const PREFIX = "killjoy-quiz-";

/**
 * Like useState but persisted to localStorage under `killjoy-quiz-{key}`.
 * When `key` is undefined, behaves like a regular useState (no persistence).
 */
export function useQuizState<T>(
  key: string | undefined,
  initialState: T | (() => T)
): [T, (v: T | ((prev: T) => T)) => void] {
  const storageKey = key ? `${PREFIX}${key}` : undefined;

  const [state, setStateRaw] = useState<T>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) return JSON.parse(saved);
      } catch {
        // fall through to initial
      }
    }
    return typeof initialState === "function"
      ? (initialState as () => T)()
      : initialState;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [storageKey, state]);

  const setState = useCallback(
    (v: T | ((prev: T) => T)) => setStateRaw(v),
    []
  );

  return [state, setState];
}
