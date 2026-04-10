"use client";

import { createContext, useContext } from "react";
import { TournamentTheme } from "./tournaments";

const defaultTheme: TournamentTheme = {
  primary: "#006747",
  gradientFrom: "#3a5c3c",
  gradientVia: "#2e4e30",
  gradientTo: "#1e3a24",
  accent: "#3a5a3a",
  accentHover: "#4a7a4a",
  accentMuted: "#8a9e82",
  highlightBg: "rgba(0, 103, 71, 0.15)",
  badgeText: "#4ade80",
};

const ThemeContext = createContext<TournamentTheme>(defaultTheme);

export const ThemeProvider = ThemeContext.Provider;
export const useTheme = () => useContext(ThemeContext);
