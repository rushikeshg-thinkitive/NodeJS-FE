// Light/dark theme. Stores the choice and reflects it as data-theme on <html>,
// which flips all the CSS variables in tokens.css.
import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage.js";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage("chat_theme", "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle };
}
