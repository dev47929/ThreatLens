import React, { useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useNavigation } from '../state/navigation.js';
import { useSecuritySession } from '../state/securitySession.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { AnimatedLogo } from '../components/AnimatedLogo.js';
import { AnimatedTip } from '../components/AnimatedTip.js';
import { Select } from '../components/Select.js';
import { PulsingBox } from '../components/PulsingBox.js';

import { useTheme } from '../state/themeContext.js';
import { THEMES } from '../theme/themes.js';
import type { ThemeId } from '../theme/types.js';

type CommandAction =
  | 'agentChat'
  | 'chatHistory'
  | 'gitAnalysis'
  | 'securityMenu'
  | 'ddos'
  | 'sqli'
  | 'xss'
  | 'exfil'
  | 'rateLimit'
  | 'proxy'
  | 'targetUrl'
  | 'theme'
  | 'exit';

interface CommandItem {
  label: string;
  value: CommandAction;
  shortcut?: string;
}

const COMMANDS: CommandItem[] = [
  {
    label: '0. 🤖 ThreatLens Agent (Interactive Codebase Intelligence & Auto-Patching)',
    value: 'agentChat',
    shortcut: '0',
  },
  {
    label: 'T. 🎨 Theme Options (Switch theme just like Claude: claude, dark, light, daltonized, etc.)',
    value: 'theme',
    shortcut: 't',
  },
  {
    label: 'H. 📜 Chat History (Restore or review previous agent conversations)',
    value: 'chatHistory',
    shortcut: 'h',
  },
  {
    label: '1. Git Repository Analysis (Audit public repos for leaked secrets & CVEs)',
    value: 'gitAnalysis',
    shortcut: '1',
  },
  {
    label: '2. Security Testing Suite (DDoS, SQLi, XSS, Exfiltration, Rate Limiting)',
    value: 'securityMenu',
    shortcut: '2',
  },
  {
    label: '3. DDoS Simulation (Flood, Slowloris, and Burst traffic load tests)',
    value: 'ddos',
    shortcut: '3',
  },
  {
    label: '4. SQL Injection (Error-based, Union-based, and Blind delay probes)',
    value: 'sqli',
    shortcut: '4',
  },
  {
    label: '5. Cross-Site Scripting (XSS) (Reflected, Stored, and DOM script audits)',
    value: 'xss',
    shortcut: '5',
  },
  {
    label: '6. Data Exfiltration (API response & error message leakage scans)',
    value: 'exfil',
    shortcut: '6',
  },
  {
    label: '7. Rate Limiting Assessment (Verify 429 threshold enforcement)',
    value: 'rateLimit',
    shortcut: '7',
  },
  {
    label: '8. Proxy Interception & Tampering (Inspect and repeat HTTP requests)',
    value: 'proxy',
    shortcut: '8',
  },
  {
    label: '9. Configure Target & Request (Set active target endpoint, method, headers & auth)',
    value: 'targetUrl',
    shortcut: '9',
  },
  {
    label: '10. Exit ThreatLensGo (Quit terminal application)',
    value: 'exit',
    shortcut: 'q',
  },
];

export const MainMenu: React.FC = () => {
  const { push } = useNavigation();
  const { exit } = useApp();
  const { targetUrl } = useSecuritySession();
  const { columns, rows } = useTerminalSize();
  const { theme, setTheme } = useTheme();

  const [inputQuery, setInputQuery] = useState('');
  const [focusMode, setFocusMode] = useState<'menu' | 'input'>('menu');

  // NO animation hooks here — PulsingBox is isolated and handles its own ticks
  const width = Math.max(60, columns > 2 ? columns - 2 : 78);

  const handleSelect = (item: CommandItem) => {
    if (item.value === 'exit') {
      exit();
      return;
    }
    if (item.value === 'theme') {
      push({ type: 'theme' });
    } else if (item.value === 'agentChat') {
      push({ type: 'agentChat' });
    } else if (item.value === 'chatHistory') {
      push({ type: 'chatHistory' });
    } else if (item.value === 'gitAnalysis') {
      push({ type: 'gitAnalysis' });
    } else if (item.value === 'securityMenu') {
      push({ type: 'securityMenu' });
    } else if (item.value === 'ddos') {
      push({ type: 'ddos' });
    } else if (item.value === 'sqli') {
      push({ type: 'sqli' });
    } else if (item.value === 'xss') {
      push({ type: 'xss' });
    } else if (item.value === 'exfil') {
      push({ type: 'exfil' });
    } else if (item.value === 'rateLimit') {
      push({ type: 'rateLimit' });
    } else if (item.value === 'proxy') {
      push({ type: 'proxy' });
    } else if (item.value === 'targetUrl') {
      push({ type: 'targetUrl' });
    }
  };

  const handleInputSubmit = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      setFocusMode('menu');
      return;
    }

    if (trimmed.startsWith('/theme') || trimmed.startsWith('theme')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length > 1) {
        const reqTheme = parts[1] as ThemeId;
        if (reqTheme in THEMES) {
          setTheme(reqTheme);
          return;
        }
      }
      push({ type: 'theme' });
      return;
    }

    if (trimmed.includes('agent') || trimmed === '/agent' || trimmed.startsWith('fix') || trimmed.startsWith('audit') || trimmed.startsWith('search')) {
      push({ type: 'agentChat', initialPrompt: value.trim() });
    } else if (trimmed.includes('history') || trimmed === '/history') {
      push({ type: 'chatHistory' });
    } else if (trimmed.includes('git') || trimmed === '/git') {
      push({ type: 'gitAnalysis' });
    } else if (trimmed.includes('ddos') || trimmed === '/ddos') {
      push({ type: 'ddos' });
    } else if (trimmed.includes('sqli') || trimmed.includes('sql') || trimmed === '/sqli') {
      push({ type: 'sqli' });
    } else if (trimmed.includes('xss') || trimmed === '/xss') {
      push({ type: 'xss' });
    } else if (trimmed.includes('exfil') || trimmed.includes('leak') || trimmed === '/exfil') {
      push({ type: 'exfil' });
    } else if (trimmed.includes('rate') || trimmed === '/ratelimit') {
      push({ type: 'rateLimit' });
    } else if (trimmed.includes('proxy') || trimmed === '/proxy') {
      push({ type: 'proxy' });
    } else if (trimmed.includes('target') || trimmed === '/target') {
      push({ type: 'targetUrl' });
    } else if (trimmed.includes('exit') || trimmed === '/exit' || trimmed === 'quit' || trimmed === ':q') {
      exit();
    } else {
      push({ type: 'agentChat', initialPrompt: value.trim() });
    }
  };

  useInput(
    (input, key) => {
      if (key.escape) {
        if (focusMode === 'input') {
          setFocusMode('menu');
        } else {
          exit();
        }
      } else if (key.tab) {
        setFocusMode((prev) => (prev === 'menu' ? 'input' : 'menu'));
      } else if (focusMode === 'menu') {
        // Direct single-key shortcuts when menu is active
        if (input === '0') {
          handleSelect(COMMANDS[0]);
        } else if (input === 't' || input === 'T') {
          push({ type: 'theme' });
        } else if (input === 'h' || input === 'H') {
          push({ type: 'chatHistory' });
        } else if (input === '1') {
          handleSelect(COMMANDS[3]);
        } else if (input === '2') {
          handleSelect(COMMANDS[4]);
        } else if (input === '3') {
          handleSelect(COMMANDS[5]);
        } else if (input === '4') {
          handleSelect(COMMANDS[6]);
        } else if (input === '5') {
          handleSelect(COMMANDS[7]);
        } else if (input === '6') {
          handleSelect(COMMANDS[8]);
        } else if (input === '7') {
          handleSelect(COMMANDS[9]);
        } else if (input === '8') {
          handleSelect(COMMANDS[10]);
        } else if (input === '9') {
          handleSelect(COMMANDS[11]);
        } else if (input === 'q') {
          exit();
        } else if (input === '/' || input === ':') {
          setFocusMode('input');
        }
      }
    },
    { isActive: true }
  );

  return (
    <Box
      flexDirection="column"
      width={width}
      paddingX={2}
      marginY={1}
    >
      {/* Top Section with Animated Logo */}
      <Box flexDirection="column" alignItems="center">
        <AnimatedLogo />
      </Box>

      {/* Center Interactive Prompt & Menu */}
      <Box flexDirection="column" alignItems="center" marginY={1}>
        {/* Command Input Card — PulsingBox is isolated: only IT re-renders on pulse ticks */}
        <PulsingBox
          isActive={focusMode === 'input'}
          activeColorA={theme.accent}
          activeColorB={theme.secondary}
          inactiveColor="gray"
          borderStyle="round"
          paddingX={2}
          paddingY={1}
          width={Math.min(width - 4, 88)}
          flexDirection="column"
        >
          {/* Search/Ask line */}
          <Box flexDirection="row" alignItems="center">
            <Box width={3}>
              <Text color={focusMode === 'input' ? theme.highlight : 'gray'} bold>
                {focusMode === 'input' ? '›' : '·'}
              </Text>
            </Box>
            <Box flexGrow={1}>
              <TextInput
                value={inputQuery}
                onChange={(val) => {
                  setInputQuery(val);
                  setFocusMode('input');
                }}
                onSubmit={handleInputSubmit}
                focus={focusMode === 'input'}
                placeholder={
                  focusMode === 'input'
                    ? "Type query, /theme, or press enter (e.g. 'audit /api/search')..."
                    : "Press Tab or / to type custom agent query, T for theme, or 0-9 to select"
                }
              />
            </Box>
          </Box>

          {/* Engine tags */}
          <Box flexDirection="row" marginTop={1} paddingLeft={3}>
            <Text color={theme.accent} bold>Security</Text>
            <Text color="gray"> · </Text>
            <Text color="white">ThreatLensGo Engine</Text>
            <Text color="gray"> · </Text>
            <Text color={theme.secondary} bold>by CodeSena</Text>
            <Text color="gray"> · </Text>
            <Text dimColor color={theme.textMuted}>
              {targetUrl ? `⬡ ${targetUrl}` : 'OpenAudit Zen'}
            </Text>
          </Box>
        </PulsingBox>

        {/* Hotkey Pills Bar */}
        <Box flexDirection="row" marginTop={1} justifyContent="center">
          <Text bold color={theme.secondary}>0-9</Text>
          <Text color={theme.textMuted}> pick · </Text>
          <Text bold color={theme.highlight}>t</Text>
          <Text color={theme.textMuted}> theme · </Text>
          <Text bold color={theme.text}>tab</Text>
          <Text color={theme.textMuted}> mode · </Text>
          <Text bold color={theme.text}>↑↓/enter</Text>
          <Text color={theme.textMuted}> select · </Text>
          <Text bold color={theme.text}>esc</Text>
          <Text color={theme.textMuted}> exit</Text>
        </Box>

        {/* Select Menu */}
        <Box
          flexDirection="column"
          marginTop={1}
          width={Math.min(width - 4, 88)}
          borderStyle="round"
          borderColor={focusMode === 'menu' ? theme.highlight : 'gray'}
          paddingX={1}
        >
          {/* Menu header */}
          <Box paddingX={1} paddingTop={0}>
            <Text color={focusMode === 'menu' ? theme.highlight : 'gray'} bold dimColor={focusMode !== 'menu'}>
              {focusMode === 'menu' ? '◈ COMMANDS' : '○ COMMANDS'}
            </Text>
          </Box>
          <Select
            items={COMMANDS}
            onSelect={handleSelect}
            isFocused={focusMode === 'menu'}
            limit={rows && rows < 36 ? 7 : undefined}
          />
        </Box>

        {/* Animated Tip Carousel */}
        <Box marginTop={1}>
          <AnimatedTip />
        </Box>
      </Box>

      {/* Bottom Statusline */}
      <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
        <Box flexDirection="row">
          <Text dimColor color={theme.textMuted}>
            ThreatLensGo:main
          </Text>
        </Box>
        <Box flexDirection="row">
          <Text dimColor color={theme.textMuted}>
            v0.1.0 · theme:{theme.id}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export const MainMenuScreen = MainMenu;
