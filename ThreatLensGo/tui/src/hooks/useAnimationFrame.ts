import { useEffect, useRef, useCallback } from 'react';

type AnimationSubscriber = {
  id: number;
  intervalMs: number;
  lastRun: number;
  callback: () => void;
};

/**
 * Master Animation Ticker
 * 
 * Synchronizes all animated components across the TUI into unified render frames.
 * Eliminates competing, unaligned setInterval timers that cause terminal stutter.
 * When multiple components tick in the same window, React 18 batches them into
 * a single Ink terminal diff update instead of multiple cascading redraws.
 */
class MasterAnimationTicker {
  private subscribers = new Map<number, AnimationSubscriber>();
  private intervalId: NodeJS.Timeout | null = null;
  private nextId = 1;
  // 40ms master tick resolution (~25fps internal clock)
  private readonly TICK_MS = 40;

  public subscribe(callback: () => void, intervalMs: number): () => void {
    const id = this.nextId++;
    this.subscribers.set(id, {
      id,
      intervalMs: Math.max(40, intervalMs),
      lastRun: Date.now(),
      callback,
    });

    if (!this.intervalId) {
      this.start();
    }

    return () => {
      this.subscribers.delete(id);
      if (this.subscribers.size === 0 && this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    };
  }

  private start(): void {
    this.intervalId = setInterval(() => {
      if (this.subscribers.size === 0) {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
        return;
      }

      const now = Date.now();
      const dueCallbacks: Array<() => void> = [];

      for (const sub of this.subscribers.values()) {
        if (now - sub.lastRun >= sub.intervalMs) {
          sub.lastRun = now;
          dueCallbacks.push(sub.callback);
        }
      }

      // Synchronously invoke all due callbacks in the same JS turn for React 18 automatic batching
      for (let i = 0; i < dueCallbacks.length; i++) {
        dueCallbacks[i]();
      }
    }, this.TICK_MS);
  }
}

export const masterTicker = new MasterAnimationTicker();

/**
 * Stable interval hook that subscribes to the unified master ticker.
 * Avoids stale closures and aligns with other animated components.
 */
export function useStableInterval(
  callback: () => void,
  delayMs: number,
  enabled: boolean = true
): void {
  const callbackRef = useRef<() => void>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!enabled || delayMs <= 0) return;
    return masterTicker.subscribe(() => {
      callbackRef.current();
    }, delayMs);
  }, [enabled, delayMs]);
}

/**
 * Returns a stable increment function that advances a frame counter without triggering re-renders.
 */
export function useFrameRef(
  delayMs: number,
  enabled: boolean = true
): React.MutableRefObject<number> {
  const frameRef = useRef(0);
  useStableInterval(
    useCallback(() => {
      frameRef.current = frameRef.current + 1;
    }, []),
    delayMs,
    enabled
  );
  return frameRef;
}
