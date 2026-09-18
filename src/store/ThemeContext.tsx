import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ColorTheme = "light" | "dark";

type ThemeContextValue = {
  colorTheme: ColorTheme;
  highContrast: boolean;
  setColorTheme: (theme: ColorTheme) => void;
  setHighContrast: (enabled: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "meomulgyeong_color_theme";
const CONTRAST_KEY = "meomulgyeong_high_contrast";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    try { return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; }
  });
  const [highContrast, setHighContrast] = useState(() => {
    try { return localStorage.getItem(CONTRAST_KEY) === "true"; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme;
    try { localStorage.setItem(THEME_KEY, colorTheme); } catch { /* storage unavailable */ }
  }, [colorTheme]);

  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast ? "high" : "normal";
    try { localStorage.setItem(CONTRAST_KEY, String(highContrast)); } catch { /* storage unavailable */ }
  }, [highContrast]);

  return <ThemeContext.Provider value={{ colorTheme, highContrast, setColorTheme, setHighContrast }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
