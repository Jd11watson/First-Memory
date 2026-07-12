// theme.js — single source of truth for color tokens.
//
// Values come straight from the dataviz skill's validated reference palette
// (categorical 8-slot theme, chrome/ink, surfaces). The same tokens are mirrored
// as CSS custom properties in index.css; this JS copy exists because the network
// graph renders to a <canvas> and needs raw hex at draw time (CSS vars don't
// reach canvas). Keep the two in sync — change here and in index.css together.

// Categorical slots — fixed order, never cycled. Both modes are selected steps,
// not an auto-flip of the light values.
export const CATEGORICAL = {
  light: ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'],
  dark: ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926'],
}

// Chrome / ink tokens per mode.
export const CHROME = {
  light: {
    surface: '#fcfcfb',
    plane: '#f9f9f7',
    panel: '#ffffff',
    textPrimary: '#0b0b0b',
    textSecondary: '#52514e',
    textMuted: '#898781',
    gridline: '#e1e0d9',
    baseline: '#c3c2b7',
    border: 'rgba(11,11,11,0.10)',
    neutral: '#898781', // "Other" bucket / unclassified
    link: 'rgba(11,11,11,0.10)',
  },
  dark: {
    surface: '#1a1a19',
    plane: '#0d0d0d',
    panel: '#232322',
    textPrimary: '#ffffff',
    textSecondary: '#c3c2b7',
    textMuted: '#898781',
    gridline: '#2c2c2a',
    baseline: '#383835',
    border: 'rgba(255,255,255,0.10)',
    neutral: '#898781',
    link: 'rgba(255,255,255,0.12)',
  },
}

export function tokens(mode) {
  return { ...CHROME[mode], categorical: CATEGORICAL[mode] }
}
