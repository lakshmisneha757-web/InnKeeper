/**
 * Single Source of Truth for Project Theming Configuration
 * Modifying values in this file will automatically update the entire theme
 * across all pages, components, buttons, sidebars, and cards in the application.
 */

export interface ThemeConfig {
  brand: {
    name: string;
    tagline: string;
    logoUrl?: string;
  };
  colors: {
    // Primary & Accent Colors
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    
    // Core Layout Colors
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    
    // Feedback & Utility Colors
    destructive: string;
    destructiveForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;

    // Dedicated Sidebar Component Palette
    sidebar: {
      background: string;
      foreground: string;
      primary: string;
      primaryForeground: string;
      accent: string;
      accentForeground: string;
      border: string;
      ring: string;
    };
  };
  shape: {
    borderRadiusSm: string;
    borderRadiusMd: string;
    borderRadiusLg: string;
  };
  typography: {
    fontFamily: string;
  };
}

export const themeConfig: ThemeConfig = {
  brand: {
    name: "InnKeeper Motel PMS",
    tagline: "Modern Hotel & Motel Management System",
  },
  colors: {
    // Primary Brand Colors (Rich Royal Purple / Indigo Theme)
    primary: "#6366f1",
    primaryForeground: "#ffffff",
    secondary: "#a855f7",
    secondaryForeground: "#ffffff",
    accent: "#f43f5e",
    accentForeground: "#ffffff",

    // Background & Surfaces
    background: "#f8fafc",
    foreground: "#0f172a",
    card: "#ffffff",
    cardForeground: "#0f172a",
    popover: "#ffffff",
    popoverForeground: "#0f172a",

    // Utilities & Status
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    border: "#e2e8f0",
    input: "#e2e8f0",
    ring: "#6366f1",

    // Sidebar Specific Palette
    sidebar: {
      background: "#0f172a",
      foreground: "#f8fafc",
      primary: "#6366f1",
      primaryForeground: "#ffffff",
      accent: "#1e293b",
      accentForeground: "#f8fafc",
      border: "#1e293b",
      ring: "#6366f1",
    },
  },
  shape: {
    borderRadiusSm: "0.5rem",
    borderRadiusMd: "0.75rem",
    borderRadiusLg: "1rem",
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

export default themeConfig;
