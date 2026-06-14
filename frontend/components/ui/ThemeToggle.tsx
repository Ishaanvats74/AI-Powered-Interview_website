"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
        hover:scale-105
        transition-all
      "
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}