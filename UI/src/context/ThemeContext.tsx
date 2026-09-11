import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fc_theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "dark";
  });

  const applyTheme = (t: Theme) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.setAttribute("data-theme", t);
      if (t === "light") {
        root.classList.add("theme-light");
        root.classList.remove("dark");
      } else {
        root.classList.remove("theme-light");
        root.classList.add("dark");
      }
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("fc_theme", newTheme);
      window.dispatchEvent(new CustomEvent("fc-theme-changed", { detail: newTheme }));
    }
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    applyTheme(theme);

    const handleThemeEvent = (e: any) => {
      if (e.detail && (e.detail === "dark" || e.detail === "light")) {
        setThemeState(e.detail);
        applyTheme(e.detail);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "fc_theme" && (e.newValue === "dark" || e.newValue === "light")) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };

    window.addEventListener("fc-theme-changed", handleThemeEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("fc-theme-changed", handleThemeEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "dark" as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}

export function ThemeToggle({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isLight ? "Switch to Dark theme" : "Switch to Dim Light theme"}
      aria-label={isLight ? "Switch to Dark theme" : "Switch to Dim Light theme"}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer shadow-sm",
        isLight
          ? "bg-amber-500/15 border-amber-500/40 text-amber-600 hover:bg-amber-500/25 hover:border-amber-500"
          : "bg-surface-2/80 border-border text-foreground hover:bg-surface hover:border-primary/50",
        className
      )}
    >
      {isLight ? (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-500 animate-spin-slow" />
          {showLabel && <span>Dim Light</span>}
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-primary" />
          {showLabel && <span>Dark</span>}
        </>
      )}
    </button>
  );
}
