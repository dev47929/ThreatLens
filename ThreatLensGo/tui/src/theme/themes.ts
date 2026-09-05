import fs from 'fs';
import path from 'path';
import os from 'os';
import { ThemeId, ThemeTokens } from './types.js';

export const THEMES: Record<ThemeId, ThemeTokens> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    description: "Anthropic's signature warm terracotta, amber & sand aesthetic",
    isDark: true,
    accent: '#D97757',       // Claude Terracotta
    secondary: '#F59E0B',    // Warm Amber
    highlight: '#CC785C',    // Copper / Coral
    border: '#D97757',
    text: '#FDFBF7',         // Warm Pearl
    textMuted: '#A8A29E',    // Warm Stone Gray
    success: '#34D399',      // Emerald
    warning: '#F59E0B',      // Amber
    error: '#EF4444',        // Red
    info: '#38BDF8',         // Sky Blue
    userMsg: '#F59E0B',      // Warm Amber
    agentMsg: '#D97757',     // Claude Terracotta
  },

  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Default modern dark theme with electric cyan and indigo accents',
    isDark: true,
    accent: '#38BDF8',       // Electric Cyan
    secondary: '#818CF8',    // Indigo
    highlight: '#818CF8',
    border: '#38BDF8',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#EF4444',
    info: '#60A5FA',
    userMsg: '#38BDF8',
    agentMsg: '#34D399',
  },

  light: {
    id: 'light',
    name: 'Light',
    description: 'High-clarity theme optimized for light-background terminals',
    isDark: false,
    accent: '#2563EB',       // Royal Blue
    secondary: '#4F46E5',    // Indigo
    highlight: '#2563EB',
    border: '#2563EB',
    text: '#0F172A',         // Slate 900
    textMuted: '#64748B',    // Slate 500
    success: '#059669',      // Dark Emerald
    warning: '#D97706',      // Dark Amber
    error: '#DC2626',        // Dark Red
    info: '#0284C7',         // Dark Sky
    userMsg: '#2563EB',
    agentMsg: '#059669',
  },

  'dark-daltonized': {
    id: 'dark-daltonized',
    name: 'Dark Daltonized',
    description: 'Colorblind-accessible dark mode (replaces red/green with blue/gold)',
    isDark: true,
    accent: '#3B82F6',       // Vibrant Blue
    secondary: '#F59E0B',    // Safety Gold / Amber
    highlight: '#60A5FA',
    border: '#3B82F6',
    text: '#FFFFFF',
    textMuted: '#CBD5E1',
    success: '#60A5FA',      // Clear Blue for OK
    warning: '#FBBF24',      // Bright Yellow
    error: '#F97316',        // Safety Orange for Alert
    info: '#38BDF8',
    userMsg: '#3B82F6',
    agentMsg: '#F59E0B',
  },

  'light-daltonized': {
    id: 'light-daltonized',
    name: 'Light Daltonized',
    description: 'Colorblind-accessible light mode for high-visibility contrast',
    isDark: false,
    accent: '#1D4ED8',       // Deep Royal Blue
    secondary: '#B45309',    // High-contrast Amber
    highlight: '#1D4ED8',
    border: '#1D4ED8',
    text: '#0F172A',
    textMuted: '#475569',
    success: '#2563EB',      // Blue for Pass
    warning: '#B45309',      // Deep Amber
    error: '#C2410C',        // Deep Rust Orange
    info: '#0284C7',
    userMsg: '#1D4ED8',
    agentMsg: '#B45309',
  },

  'dark-ansi': {
    id: 'dark-ansi',
    name: 'Dark ANSI',
    description: '16 standard ANSI colors for maximum compatibility with legacy terminals',
    isDark: true,
    accent: 'cyan',
    secondary: 'yellow',
    highlight: 'cyan',
    border: 'cyan',
    text: 'white',
    textMuted: 'gray',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'blue',
    userMsg: 'cyan',
    agentMsg: 'green',
  },

  'light-ansi': {
    id: 'light-ansi',
    name: 'Light ANSI',
    description: '16 standard ANSI colors optimized for light-background terminals',
    isDark: false,
    accent: 'blue',
    secondary: 'magenta',
    highlight: 'blue',
    border: 'blue',
    text: 'black',
    textMuted: 'gray',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'cyan',
    userMsg: 'blue',
    agentMsg: 'magenta',
  },

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'High-voltage neon synthwave with electric yellow, pink & cyan',
    isDark: true,
    accent: '#FACC15',       // Neon Yellow
    secondary: '#F43F5E',    // Neon Pink
    highlight: '#22D3EE',    // Bright Cyan
    border: '#FACC15',
    text: '#F8FAFC',
    textMuted: '#A1A1AA',
    success: '#4ADE80',      // Neon Green
    warning: '#FB923C',      // Neon Orange
    error: '#F43F5E',        // Neon Red/Pink
    info: '#22D3EE',         // Cyan
    userMsg: '#FACC15',
    agentMsg: '#F43F5E',
  },

  dracula: {
    id: 'dracula',
    name: 'Dracula',
    description: 'Classic gothic dark palette with purple, pink and lime accents',
    isDark: true,
    accent: '#BD93F9',       // Dracula Purple
    secondary: '#FF79C6',    // Dracula Pink
    highlight: '#8BE9FD',    // Dracula Cyan
    border: '#BD93F9',
    text: '#F8F8F2',
    textMuted: '#6272A4',    // Dracula Comment Gray
    success: '#50FA7B',      // Dracula Green
    warning: '#FFB86C',      // Dracula Orange
    error: '#FF5555',        // Dracula Red
    info: '#8BE9FD',         // Dracula Cyan
    userMsg: '#BD93F9',
    agentMsg: '#50FA7B',
  },

  matrix: {
    id: 'matrix',
    name: 'Matrix',
    description: 'Iconic phosphor green hacker aesthetic',
    isDark: true,
    accent: '#22C55E',       // Matrix Phosphor Green
    secondary: '#84CC16',    // Bright Lime
    highlight: '#4ADE80',    // Glowing Green
    border: '#22C55E',
    text: '#DCFCE7',         // Light Phosphor Green
    textMuted: '#15803D',    // Deep Green
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#10B981',
    userMsg: '#4ADE80',
    agentMsg: '#22C55E',
  },

  'solarized-dark': {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: 'Ethan Schoonover\'s precision palette with cyan, blue & warm amber',
    isDark: true,
    accent: '#2AA198',       // Solarized Cyan
    secondary: '#268BD2',    // Solarized Blue
    highlight: '#B58900',    // Solarized Yellow
    border: '#2AA198',
    text: '#EEE8D5',         // Base2
    textMuted: '#93A1A1',    // Base1
    success: '#859900',      // Solarized Green
    warning: '#B58900',      // Solarized Yellow
    error: '#DC322F',        // Solarized Red
    info: '#268BD2',         // Solarized Blue
    userMsg: '#2AA198',
    agentMsg: '#859900',
  },
};

export const THEME_LIST: ThemeTokens[] = Object.values(THEMES);

export function getConfigFilePath(): string {
  return path.join(os.homedir(), '.threatlensgo', 'config.json');
}

export function loadSavedThemeId(): ThemeId {
  // Check environment variable first
  const envTheme = process.env.THREATLENS_THEME?.toLowerCase().trim();
  if (envTheme && envTheme in THEMES) {
    return envTheme as ThemeId;
  }

  try {
    const configPath = getConfigFilePath();
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.theme === 'string' && parsed.theme in THEMES) {
        return parsed.theme as ThemeId;
      }
    }
  } catch {
    // Fail gracefully to default
  }

  // Default to claude theme
  return 'claude';
}

export function saveThemeId(themeId: ThemeId): void {
  try {
    const dir = path.join(os.homedir(), '.threatlensgo');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const configPath = path.join(dir, 'config.json');
    let existing: Record<string, any> = {};
    if (fs.existsSync(configPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch {
        existing = {};
      }
    }
    existing.theme = themeId;
    existing.updatedAt = new Date().toISOString();
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2), 'utf-8');
  } catch {
    // Fail gracefully
  }
}

export function getTheme(id: string): ThemeTokens {
  if (id in THEMES) {
    return THEMES[id as ThemeId];
  }
  return THEMES.claude;
}
