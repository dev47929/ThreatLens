import { useState, useEffect } from 'react';
import { useStdout } from 'ink';

export interface TerminalSize {
  columns: number;
  rows: number;
}

export const useTerminalSize = (): TerminalSize => {
  const { stdout } = useStdout();

  const getDimensions = (): TerminalSize => ({
    columns: stdout?.columns ?? process.stdout.columns ?? 80,
    rows: stdout?.rows ?? process.stdout.rows ?? 24,
  });

  const [size, setSize] = useState<TerminalSize>(getDimensions);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const handleResize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const next = getDimensions();
        setSize((prev) => {
          if (prev.columns === next.columns && prev.rows === next.rows) {
            return prev;
          }
          return next;
        });
      }, 100);
    };

    const targetStream = stdout ?? process.stdout;
    targetStream.on('resize', handleResize);
    if (stdout && stdout !== process.stdout) {
      process.stdout.on('resize', handleResize);
    }

    return () => {
      if (timer) clearTimeout(timer);
      targetStream.off('resize', handleResize);
      if (stdout && stdout !== process.stdout) {
        process.stdout.off('resize', handleResize);
      }
    };
  }, [stdout]);

  return size;
};
