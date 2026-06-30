"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { isDark, toggle } = useThemeMode();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="切换深浅色主题">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
