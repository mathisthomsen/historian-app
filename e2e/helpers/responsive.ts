/**
 * Playwright responsive testing helpers.
 * Viewport presets for the four primary breakpoints defined in the design system.
 */

export const VIEWPORTS = {
  mobile: { width: 320, height: 568 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  desktopXL: { width: 1280, height: 800 },
  desktopWide: { width: 1536, height: 864 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;
