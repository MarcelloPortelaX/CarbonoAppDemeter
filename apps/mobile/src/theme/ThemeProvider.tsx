import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { AppTheme, ResolvedTheme, ThemeMode, themeFor } from './tokens';

const STORAGE_KEY = 'demeter.theme.mode.v1';

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  theme: AppTheme;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function DemeterThemeProvider({ children }: React.PropsWithChildren) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [mode, setModeState] = useState<ThemeMode>('system');
  const resolved: ResolvedTheme = mode === 'system' ? system : mode;
  const theme = useMemo(() => themeFor(resolved), [resolved]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'system' || value === 'light' || value === 'dark') setModeState(value);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    try {
      SystemUI.setBackgroundColorAsync(theme.colors.background).catch((err) => {
        console.warn('SystemUI background failed:', err);
      });
    } catch (err) {
      console.warn('SystemUI sync failed:', err);
    }

    if (Platform.OS === 'android') {
      try {
        NavigationBar.setStyleAsync(resolved === 'dark' ? 'dark' : 'light').catch((err) => {
          console.warn('NavigationBar style failed:', err);
        });
      } catch (err) {
        console.warn('NavigationBar sync failed:', err);
      }
    }

    try {
      if (mode !== 'system') Appearance.setColorScheme(mode);
    } catch (err) {
      console.warn('Appearance set failed:', err);
    }
  }, [mode, resolved, theme.colors.background]);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, theme, setMode }}>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useDemeterTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useDemeterTheme must be used inside DemeterThemeProvider');
  return context;
}
