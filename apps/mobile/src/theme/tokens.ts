export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const brand = {
  neon: '#39FF68',
  neonStrong: '#15F34F',
  neonSoft: '#8DFFAA',
  forest: '#073C22',
  forestDeep: '#031B11',
  warning: '#FF9D00',
  danger: '#FF5C67',
} as const;

const common = {
  spacing: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 },
  radius: { xs: 10, sm: 14, md: 18, lg: 24, xl: 30, pill: 999 },
  touch: { minimum: 44, preferred: 48 },
  layout: { screenPadding: 16, bottomNavHeight: 72, headerHeight: 64 },
  brand,
} as const;

export const lightTheme = {
  ...common,
  mode: 'light' as const,
  colors: {
    background: '#F6F8F6', surface: '#FFFFFF', surfaceAlt: '#EFF4F0', surfaceStrong: '#073C22',
    text: '#0A1B12', textMuted: '#647068', border: '#D8E2DA', borderStrong: '#133C27',
    icon: '#173A27', shadow: 'rgba(3,27,17,0.12)', scrim: 'rgba(3,27,17,0.38)', mapSheet: '#FFFFFF',
    success: '#18C64B', warning: '#D77D00', danger: '#D93F4C', onNeon: '#031B11', onStrong: '#FFFFFF',
  },
} as const;

export const darkTheme = {
  ...common,
  mode: 'dark' as const,
  colors: {
    background: '#020A07', surface: '#07110D', surfaceAlt: '#0B1711', surfaceStrong: '#041B10',
    text: '#F5FFF7', textMuted: '#A6B5AB', border: '#183425', borderStrong: '#2B7D47',
    icon: '#E8F7EC', shadow: 'rgba(0,0,0,0.48)', scrim: 'rgba(0,0,0,0.60)', mapSheet: '#07110D',
    success: '#39FF68', warning: '#FF9D00', danger: '#FF6670', onNeon: '#021007', onStrong: '#F5FFF7',
  },
} as const;

export type AppTheme = typeof lightTheme | typeof darkTheme;
export const themeFor = (mode: ResolvedTheme): AppTheme => mode === 'dark' ? darkTheme : lightTheme;
