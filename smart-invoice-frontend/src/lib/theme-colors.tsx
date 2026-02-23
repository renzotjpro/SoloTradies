"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ColorThemeName =
  | "emerald"
  | "blue"
  | "purple"
  | "orange"
  | "rose"
  | "slate";

interface ColorShades {
  50: string;
  100: string;
  200: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export const colorThemes: Record<
  ColorThemeName,
  { label: string; shades: ColorShades }
> = {
  emerald: {
    label: "Emerald",
    shades: {
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
      950: "#022c22",
    },
  },
  blue: {
    label: "Blue",
    shades: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
      950: "#172554",
    },
  },
  purple: {
    label: "Purple",
    shades: {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7e22ce",
      800: "#6b21a8",
      900: "#581c87",
      950: "#3b0764",
    },
  },
  orange: {
    label: "Orange",
    shades: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      400: "#fb923c",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
      950: "#431407",
    },
  },
  rose: {
    label: "Rose",
    shades: {
      50: "#fff1f2",
      100: "#ffe4e6",
      200: "#fecdd3",
      400: "#fb7185",
      500: "#f43f5e",
      600: "#e11d48",
      700: "#be123c",
      800: "#9f1239",
      900: "#881337",
      950: "#4c0519",
    },
  },
  slate: {
    label: "Slate",
    shades: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },
  },
};

const STORAGE_KEY = "invoize-color-theme";

interface ColorThemeContext {
  colorTheme: ColorThemeName;
  setColorTheme: (theme: ColorThemeName) => void;
}

const ColorThemeCtx = createContext<ColorThemeContext>({
  colorTheme: "emerald",
  setColorTheme: () => {},
});

function applyTheme(name: ColorThemeName) {
  const { shades } = colorThemes[name];
  const root = document.documentElement;
  for (const [shade, value] of Object.entries(shades)) {
    root.style.setProperty(`--brand-${shade}`, value);
  }
}

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeName>("emerald");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorThemeName | null;
    if (stored && stored in colorThemes) {
      setColorThemeState(stored);
      applyTheme(stored);
    }
  }, []);

  const setColorTheme = (theme: ColorThemeName) => {
    setColorThemeState(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  };

  return (
    <ColorThemeCtx.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeCtx.Provider>
  );
}

export function useColorTheme() {
  return useContext(ColorThemeCtx);
}
