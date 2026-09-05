import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TerminalLayout } from '../components/TerminalLayout.js';
import { useNavigation } from '../state/navigation.js';
import { useTheme } from '../state/themeContext.js';
import { THEME_LIST, THEMES } from '../theme/themes.js';
import { ThemeId, ThemeTokens } from '../theme/types.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

export const ThemeScreen: React.FC = () => {
  const { pop } = useNavigation();
  const { themeId, savedThemeId, setTheme, previewTheme, cancelPreview } = useTheme();
  const { columns } = useTerminalSize();

  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    const idx = THEME_LIST.findIndex((t) => t.id === savedThemeId);
    return idx >= 0 ? idx : 0;
  });

  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const activeCandidate = THEME_LIST[selectedIndex] || THEME_LIST[0];

  // Whenever selectedIndex changes, trigger preview
  useEffect(() => {
    if (activeCandidate) {
      previewTheme(activeCandidate.id);
    }
  }, [selectedIndex, activeCandidate, previewTheme]);

  useInput((input, key) => {
    if (appliedNotification) {
      // If notification is showing, any key exits back
      pop();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : THEME_LIST.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < THEME_LIST.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      // Apply and save
      const chosen = THEME_LIST[selectedIndex];
      if (chosen) {
        setTheme(chosen.id);
        setAppliedNotification(`✓ Theme applied: "${chosen.name}". Saved to ~/.threatlensgo/config.json`);
        setTimeout(() => {
          pop();
        }, 600);
      }
    } else if (key.escape) {
      // Cancel preview and exit
      cancelPreview();
      pop();
    } else if (input >= '1' && input <= '9') {
      const num = parseInt(input, 10) - 1;
      if (num < THEME_LIST.length) {
        setSelectedIndex(num);
      }
    }
  });

  const width = Math.max(60, columns > 2 ? columns - 2 : 78);
  const isWide = width >= 80;

  return (
    <TerminalLayout
      title="Theme & Appearance Settings"
      subtitle="Select a theme matching your terminal aesthetic. Press Enter to save."
      breadcrumb="THEME"
      statusText="SELECT THEME"
      statusType="ready"
      keyHints="↑↓ navigate · enter select & save · esc cancel"
    >
      <Box flexDirection="column">
        {appliedNotification ? (
          <Box
            borderStyle="round"
            borderColor={activeCandidate.success}
            paddingX={2}
            paddingY={1}
            marginY={1}
          >
            <Text bold color={activeCandidate.success}>
              {appliedNotification}
            </Text>
          </Box>
        ) : (
          <Box flexDirection={isWide ? 'row' : 'column'} gap={1} marginY={0}>
            {/* Theme list */}
            <Box
              flexDirection="column"
              width={isWide ? Math.floor(width * 0.46) : undefined}
              borderStyle="round"
              borderColor={activeCandidate.accent}
              paddingX={1}
              paddingY={0}
            >
              <Box paddingBottom={0} marginBottom={1} borderStyle="single" borderColor={activeCandidate.border}>
                <Text bold color={activeCandidate.accent}>
                  🎨 AVAILABLE THEMES ({THEME_LIST.length})
                </Text>
              </Box>

              {THEME_LIST.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const isSaved = item.id === savedThemeId;

                return (
                  <Box
                    key={item.id}
                    flexDirection="column"
                    paddingY={0}
                    marginBottom={0}
                  >
                    <Box flexDirection="row" alignItems="center">
                      <Box width={3}>
                        <Text color={isSelected ? activeCandidate.highlight : 'gray'} bold={isSelected}>
                          {isSelected ? '❯' : ' '}
                        </Text>
                      </Box>
                      <Box width={3}>
                        <Text color={isSaved ? activeCandidate.success : 'gray'}>
                          {isSaved ? '●' : '○'}
                        </Text>
                      </Box>
                      <Text
                        bold={isSelected}
                        color={isSelected ? activeCandidate.highlight : item.isDark ? 'white' : 'white'}
                      >
                        {item.name}
                      </Text>
                      {isSaved && (
                        <Text color={activeCandidate.success} dimColor>
                          {' '}[current]
                        </Text>
                      )}
                    </Box>

                    {isSelected && (
                      <Box paddingLeft={6} marginBottom={1}>
                        <Text dimColor color={activeCandidate.textMuted}>
                          {item.description}
                        </Text>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>

            {/* Live Preview Card */}
            <Box
              flexDirection="column"
              flexGrow={1}
              borderStyle="round"
              borderColor={activeCandidate.accent}
              paddingX={2}
              paddingY={0}
            >
              <Box paddingBottom={0} marginBottom={1} borderStyle="single" borderColor={activeCandidate.border}>
                <Text bold color={activeCandidate.accent}>
                  👁 LIVE PREVIEW: {activeCandidate.name.toUpperCase()}
                </Text>
              </Box>

              <Text dimColor color={activeCandidate.textMuted} italic>
                {activeCandidate.description}
              </Text>

              {/* Palette Color Swatches */}
              <Box flexDirection="column" marginY={1}>
                <Text bold color={activeCandidate.text}>Color Swatch Palette:</Text>
                <Box flexDirection="row" marginTop={0} flexWrap="wrap" gap={1}>
                  <Text color={activeCandidate.accent} bold>■ Accent</Text>
                  <Text color={activeCandidate.secondary} bold>■ Secondary</Text>
                  <Text color={activeCandidate.highlight} bold>■ Highlight</Text>
                  <Text color={activeCandidate.success} bold>■ Success</Text>
                  <Text color={activeCandidate.warning} bold>■ Warning</Text>
                  <Text color={activeCandidate.error} bold>■ Error</Text>
                  <Text color={activeCandidate.info} bold>■ Info</Text>
                </Box>
              </Box>

              {/* Mock Chat / Interaction Card */}
              <Box
                flexDirection="column"
                borderStyle="round"
                borderColor={activeCandidate.border}
                paddingX={1}
                marginY={1}
              >
                <Box flexDirection="row" justifyContent="space-between">
                  <Text bold color={activeCandidate.accent}>
                    ThreatLensGo [Session #1]
                  </Text>
                  <Text color={activeCandidate.success} bold>● LIVE</Text>
                </Box>

                <Box marginTop={1} flexDirection="column">
                  <Box
                    borderStyle="single"
                    borderColor={activeCandidate.userMsg}
                    paddingX={1}
                  >
                    <Text bold color={activeCandidate.userMsg}>◈ You: </Text>
                    <Text color={activeCandidate.text}>audit /api/v1/auth & test sqli</Text>
                  </Box>

                  <Box
                    borderStyle="single"
                    borderColor={activeCandidate.agentMsg}
                    paddingX={1}
                    marginTop={0}
                  >
                    <Text bold color={activeCandidate.agentMsg}>⬡ Agent: </Text>
                    <Text color={activeCandidate.text}>
                      Probed endpoint. <Text color={activeCandidate.success} bold>0 vulnerabilities</Text> found.
                    </Text>
                  </Box>
                </Box>

                <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
                  <Text color={activeCandidate.info}>⚡ 3 tools executed</Text>
                  <Text color={activeCandidate.warning}>420 / 50,000 tokens</Text>
                </Box>
              </Box>

              <Box marginTop={0} marginBottom={1}>
                <Text dimColor color={activeCandidate.textMuted}>
                  Press <Text bold color={activeCandidate.highlight}>Enter</Text> to apply this theme or <Text bold color={activeCandidate.highlight}>Esc</Text> to cancel.
                </Text>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </TerminalLayout>
  );
};

export default ThemeScreen;
