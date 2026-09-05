import { useState } from 'react';
import { useStableInterval } from './useAnimationFrame.js';

// Classic braille-style spinner frames for premium feel
export const SPINNER_DOTS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Block-style spinner for wider contexts
export const SPINNER_BLOCKS = ['▖', '▘', '▝', '▗'];

// Arc spinner
export const SPINNER_ARC = ['◜', '◠', '◝', '◞', '◡', '◟'];

// Line spinner
export const SPINNER_LINE = ['─', '\\', '│', '/'];

// Pulse / heartbeat  
export const SPINNER_PULSE = ['◆', '◈', '◇', '◈'];

export type SpinnerType = 'dots' | 'blocks' | 'arc' | 'line' | 'pulse';

const SPINNER_SETS: Record<SpinnerType, string[]> = {
  dots: SPINNER_DOTS,
  blocks: SPINNER_BLOCKS,
  arc: SPINNER_ARC,
  line: SPINNER_LINE,
  pulse: SPINNER_PULSE,
};

/**
 * Shared spinner hook — returns the current spinner frame character.
 * Uses useStableInterval to avoid multiple competing timers.
 * All components that need a spinner use this hook at a consistent interval.
 */
export function useSpinnerFrame(
  type: SpinnerType = 'dots',
  intervalMs: number = 80,
  enabled: boolean = true
): string {
  const frames = SPINNER_SETS[type];
  const [frameIndex, setFrameIndex] = useState(0);

  useStableInterval(
    () => {
      if (enabled) {
        setFrameIndex((prev) => (prev + 1) % frames.length);
      }
    },
    intervalMs,
    enabled
  );

  return frames[frameIndex] ?? frames[0] ?? '⠋';
}

/**
 * Returns current frame index — useful for deriving other animation properties from the same tick.
 */
export function useFrameIndex(
  frameCount: number,
  intervalMs: number = 120,
  enabled: boolean = true
): number {
  const [frameIndex, setFrameIndex] = useState(0);

  useStableInterval(
    () => {
      if (enabled && frameCount > 0) {
        setFrameIndex((prev) => (prev + 1) % frameCount);
      }
    },
    intervalMs,
    enabled
  );

  return frameIndex;
}
