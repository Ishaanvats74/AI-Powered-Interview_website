"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() =>
        setTheme(theme === "dark" ? "light" : "dark")
      }
      className="
        flex items-center justify-center
        h-10 w-10
        rounded-xl
        border
        border-zinc-300
        dark:border-zinc-700
        bg-white
        dark:bg-zinc-900
      "
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}