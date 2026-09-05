import React from 'react';
import { Box, Text } from 'ink';
import SelectInput, { ItemProps, IndicatorProps } from 'ink-select-input';
import { useTheme } from '../state/themeContext.js';

export interface SelectOption<V extends string = string> {
  label: string;
  value: V;
  description?: string;
  key?: string;
}

const CustomIndicator: React.FC<IndicatorProps> = React.memo(({ isSelected }) => {
  const { theme } = useTheme();
  return (
    <Box width={3}>
      <Text color={isSelected ? theme.highlight : 'gray'} bold={isSelected}>
        {isSelected ? '❯' : ' '}
      </Text>
    </Box>
  );
});

const CustomItem: React.FC<ItemProps> = React.memo(({ isSelected, label }) => {
  const { theme } = useTheme();
  // Check if label contains description in parentheses e.g. "Option Title (Description)"
  const match = label.match(/^(.*?)\s*\((.*?)\)$/);

  if (match && match[1] && match[2]) {
    const title = match[1].trim();
    const desc = match[2].trim();

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" flexWrap="nowrap">
          {isSelected && (
            <Text color={theme.highlight} bold>{'▌ '}</Text>
          )}
          <Text
            color={theme.text}
            bold={isSelected}
            dimColor={!isSelected}
          >
            {title}
          </Text>
        </Box>
        {isSelected ? (
          <Box paddingLeft={isSelected ? 4 : 0}>
            <Text dimColor color={theme.textMuted}>
              {desc}
            </Text>
          </Box>
        ) : null}
      </Box>
    );
  }

  // Check if label contains " ── "
  if (label.includes(' ── ')) {
    const [title, desc] = label.split(' ── ');
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" flexWrap="nowrap">
          {isSelected && (
            <Text color={theme.highlight} bold>{'▌ '}</Text>
          )}
          <Text
            color={theme.text}
            bold={isSelected}
            dimColor={!isSelected}
          >
            {title}
          </Text>
        </Box>
        {isSelected && desc ? (
          <Box paddingLeft={4}>
            <Text dimColor color={theme.textMuted}>
              {desc}
            </Text>
          </Box>
        ) : null}
      </Box>
    );
  }

  return (
    <Box flexDirection="row" alignItems="center">
      {isSelected && (
        <Text color={theme.highlight} bold>{'▌ '}</Text>
      )}
      <Text
        color={theme.text}
        bold={isSelected}
        dimColor={!isSelected}
      >
        {label}
      </Text>
    </Box>
  );
});

export interface SelectProps<V extends string = string> {
  items: Array<{ label: string; value: V; key?: string }>;
  onSelect: (item: { label: string; value: V }) => void;
  isFocused?: boolean;
  initialIndex?: number;
  limit?: number;
}

export function Select<V extends string = string>({
  items,
  onSelect,
  isFocused = true,
  initialIndex = 0,
  limit,
}: SelectProps<V>): React.JSX.Element {
  return (
    <SelectInput
      items={items}
      onSelect={onSelect}
      isFocused={isFocused && Boolean(process.stdin?.isTTY)}
      initialIndex={initialIndex}
      limit={limit}
      indicatorComponent={CustomIndicator}
      itemComponent={CustomItem}
    />
  );
}

export default Select;
