import React from 'react';
import { Box } from 'ink';
import { useSpinnerFrame } from '../hooks/useSpinnerFrame.js';

interface PulsingBoxProps {
  isActive: boolean;
  children: React.ReactNode;
  activeColorA?: string;
  activeColorB?: string;
  inactiveColor?: string;
  borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
  paddingX?: number;
  paddingY?: number;
  width?: number | string;
  flexDirection?: 'row' | 'column';
}

/**
 * Isolated pulsing border box — ONLY this component re-renders on pulse ticks.
 * Use this instead of calling useSpinnerFrame in a large parent.
 */
export const PulsingBox: React.FC<PulsingBoxProps> = ({
  isActive,
  children,
  activeColorA = 'cyan',
  activeColorB = '#60A5FA',
  inactiveColor = 'gray',
  borderStyle = 'round',
  paddingX = 2,
  paddingY = 1,
  width,
  flexDirection = 'column',
}) => {
  const frame = useSpinnerFrame('pulse', 500, isActive);
  const borderColor = isActive
    ? (frame === '◆' || frame === '◈' ? activeColorA : activeColorB)
    : inactiveColor;

  return (
    <Box
      flexDirection={flexDirection}
      borderStyle={borderStyle}
      borderColor={borderColor}
      paddingX={paddingX}
      paddingY={paddingY}
      width={width as number | undefined}
    >
      {children}
    </Box>
  );
};

export default PulsingBox;
