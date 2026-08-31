import { themeConfig, ThemeConfig } from "../theme.config";

/**
 * Utility to inject theme tokens from theme.config.ts directly into root CSS variables.
 * This guarantees that changing any property in theme.config.ts updates the full app UI.
 */
export function applyTheme(config: ThemeConfig = themeConfig): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Primary & Secondary colors
  root.style.setProperty("--primary", config.colors.primary);
  root.style.setProperty("--primary-foreground", config.colors.primaryForeground);
  root.style.setProperty("--secondary", config.colors.secondary);
  root.style.setProperty("--secondary-foreground", config.colors.secondaryForeground);
  root.style.setProperty("--accent", config.colors.accent);
  root.style.setProperty("--accent-foreground", config.colors.accentForeground);

  // Background & Surfaces
  root.style.setProperty("--background", config.colors.background);
  root.style.setProperty("--foreground", config.colors.foreground);
  root.style.setProperty("--card", config.colors.card);
  root.style.setProperty("--card-foreground", config.colors.cardForeground);
  root.style.setProperty("--popover", config.colors.popover);
  root.style.setProperty("--popover-foreground", config.colors.popoverForeground);

  // Utilities & Feedback
  root.style.setProperty("--destructive", config.colors.destructive);
  root.style.setProperty("--destructive-foreground", config.colors.destructiveForeground);
  root.style.setProperty("--muted", config.colors.muted);
  root.style.setProperty("--muted-foreground", config.colors.mutedForeground);
  root.style.setProperty("--border", config.colors.border);
  root.style.setProperty("--input", config.colors.input);
  root.style.setProperty("--ring", config.colors.ring);

  // Sidebar tokens
  root.style.setProperty("--sidebar", config.colors.sidebar.background);
  root.style.setProperty("--sidebar-foreground", config.colors.sidebar.foreground);
  root.style.setProperty("--sidebar-primary", config.colors.sidebar.primary);
  root.style.setProperty("--sidebar-primary-foreground", config.colors.sidebar.primaryForeground);
  root.style.setProperty("--sidebar-accent", config.colors.sidebar.accent);
  root.style.setProperty("--sidebar-accent-foreground", config.colors.sidebar.accentForeground);
  root.style.setProperty("--sidebar-border", config.colors.sidebar.border);
  root.style.setProperty("--sidebar-ring", config.colors.sidebar.ring);

  // Typography & Radius
  root.style.setProperty("--font-sans", config.typography.fontFamily);
}

export function initTheme(): void {
  applyTheme(themeConfig);
}
