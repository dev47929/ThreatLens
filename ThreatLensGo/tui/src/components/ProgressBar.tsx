import React from 'react';
import { Box, Text } from 'ink';
import { useFrameIndex } from '../hooks/useSpinnerFrame.js';

export interface ProgressBarProps {
  percent: number; // 0 to 100
  width?: number;
  color?: string;
  emptyColor?: string;
  showShimmer?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  width = 30,
  color = 'cyan',
  emptyColor = 'gray',
  showShimmer = false,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)));
  const filledCount = Math.round((clampedPercent / 100) * width);
  const emptyCount = Math.max(0, width - filledCount);

  const isDone = clampedPercent >= 100;
  const shouldShimmer = showShimmer && !isDone && filledCount > 0;

  // Shimmer: a brighter position sweeps across filled region every 120ms (only when enabled)
  const shimmerPos = useFrameIndex(Math.max(1, filledCount + 4), 120, shouldShimmer);

  // Build bar char-by-char for gradient edge + shimmer
  const buildFilledBar = (): JSX.Element | JSX.Element[] | null => {
    if (filledCount === 0) return null;

    const fillColor = isDone ? 'green' : clampedPercent > 80 ? '#34D399' : color;

    // Fast-path: consolidated text node when not shimmering
    if (!shouldShimmer) {
      if (isDone || filledCount === 1) {
        return <Text color={fillColor}>{'█'.repeat(filledCount)}</Text>;
      }
      return (
        <Text color={fillColor}>
          {'█'.repeat(filledCount - 1)}▓
        </Text>
      );
    }

    const cells: JSX.Element[] = [];
    for (let i = 0; i < filledCount; i++) {
      const isLast = i === filledCount - 1;
      const isShimmer = i === shimmerPos % filledCount;

      let char = '█';
      if (isLast) {
        char = '▓'; // Soft edge at fill boundary
      }

      const cellColor = isShimmer ? '#FFFFFF' : fillColor;

      cells.push(
        <Text key={i} color={cellColor} bold={isShimmer}>
          {char}
        </Text>
      );
    }

    return cells;
  };

  const emptyBar = '░'.repeat(emptyCount);

  // Color ramp based on completion
  const percentColor = isDone ? 'green' : clampedPercent > 80 ? '#34D399' : clampedPercent > 50 ? 'cyan' : 'yellow';

  return (
    <Box flexDirection="row" alignItems="center">
      <Box marginRight={1} flexDirection="row">
        {buildFilledBar()}
        <Text color={emptyColor} dimColor>
          {emptyBar}
        </Text>
      </Box>
      <Text bold color={percentColor}>
        {clampedPercent}%
      </Text>
    </Box>
  );
};

export default ProgressBar;
