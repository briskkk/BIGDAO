"use client";

import { useEffect, useState } from "react";

export function useThemeMode() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("fw-theme");
    const dark = saved !== "light";
    setIsDark(dark);
    document.documentElement.classList.toggle("light", !dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggle() {
    setIsDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("light", !next);
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("fw-theme", next ? "dark" : "light");
      return next;
    });
  }

  return { isDark, toggle };
}
