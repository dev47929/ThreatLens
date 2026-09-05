import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeId, ThemeTokens } from '../theme/types.js';
import { THEMES, THEME_LIST, loadSavedThemeId, saveThemeId } from '../theme/themes.js';

export interface ThemeContextType {
  theme: ThemeTokens;
  themeId: ThemeId;
  savedThemeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  previewTheme: (id: ThemeId) => void;
  cancelPreview: () => void;
  allThemes: ThemeTokens[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [savedThemeId, setSavedThemeId] = useState<ThemeId>(() => loadSavedThemeId());
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(savedThemeId);

  // Sync on mount
  useEffect(() => {
    const initial = loadSavedThemeId();
    setSavedThemeId(initial);
    setActiveThemeId(initial);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    if (id in THEMES) {
      setSavedThemeId(id);
      setActiveThemeId(id);
      saveThemeId(id);
    }
  }, []);

  const previewTheme = useCallback((id: ThemeId) => {
    if (id in THEMES) {
      setActiveThemeId(id);
    }
  }, []);

  const cancelPreview = useCallback(() => {
    setActiveThemeId(savedThemeId);
  }, [savedThemeId]);

  const currentTheme = useMemo(() => {
    return THEMES[activeThemeId] || THEMES.claude;
  }, [activeThemeId]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: currentTheme,
      themeId: activeThemeId,
      savedThemeId,
      setTheme,
      previewTheme,
      cancelPreview,
      allThemes: THEME_LIST,
    }),
    [currentTheme, activeThemeId, savedThemeId, setTheme, previewTheme, cancelPreview]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      theme: THEMES.claude,
      themeId: 'claude',
      savedThemeId: 'claude',
      setTheme: () => {},
      previewTheme: () => {},
      cancelPreview: () => {},
      allThemes: THEME_LIST,
    };
  }
  return context;
};
