// Generic "state that persists in localStorage" hook.
import { useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  function set(next) {
    setValue((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      try {
        if (resolved === null || resolved === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(resolved));
        }
      } catch {
        /* ignore quota / private-mode errors */
      }
      return resolved;
    });
  }

  return [value, set];
}
