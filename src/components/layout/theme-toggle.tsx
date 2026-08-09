"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  // Both icons are rendered and the `dark:` variant decides which one shows, so
  // the server and client markup match without a mounted flag — and there is no
  // blank slot on first paint.
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Ganti tema terang/gelap"
      onClick={() =>
        setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")
      }
      className="text-muted-foreground hover:text-foreground"
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </Button>
  );
}
