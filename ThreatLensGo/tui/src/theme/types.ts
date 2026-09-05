export type ThemeId =
  | 'claude'
  | 'dark'
  | 'light'
  | 'dark-daltonized'
  | 'light-daltonized'
  | 'dark-ansi'
  | 'light-ansi'
  | 'cyberpunk'
  | 'dracula'
  | 'matrix'
  | 'solarized-dark';

export interface ThemeTokens {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  accent: string;       // Primary brand/border accent
  secondary: string;    // Secondary accent (subtitles, badges)
  highlight: string;    // Select cursor, focus indicator
  border: string;       // Box border color
  text: string;         // Primary text
  textMuted: string;    // Muted text (gray/dim)
  success: string;      // Green / check / ok
  warning: string;      // Amber / warning
  error: string;        // Red / failure
  info: string;         // Cyan / info
  userMsg: string;      // User bubble accent
  agentMsg: string;     // Agent bubble accent
  badgeBg?: string;     // Optional badge tint
}
