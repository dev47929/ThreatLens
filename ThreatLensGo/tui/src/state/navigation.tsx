import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type Screen =
  | { type: 'login' }
  | { type: 'mainMenu' }
  | { type: 'gitAnalysis' }
  | { type: 'targetUrl' }
  | { type: 'securityMenu' }
  | { type: 'ddos' }
  | { type: 'sqli' }
  | { type: 'xss' }
  | { type: 'exfil' }
  | { type: 'rateLimit' }
  | { type: 'proxy' }
  | { type: 'chatHistory' }
  | { type: 'theme' }
  | { type: 'agentChat'; chatId?: number; initialPrompt?: string };

export type ScreenType = Screen['type'];

export interface NavigationContextType {
  current: Screen;
  stack: Screen[];
  canGoBack: boolean;
  push: (screen: Screen) => void;
  pop: () => boolean;
  replace: (screen: Screen) => void;
  reset: (screen: Screen) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export interface NavigationProviderProps {
  initialScreen?: Screen;
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  initialScreen = { type: 'login' },
  children,
}) => {
  const [stack, setStack] = useState<Screen[]>([initialScreen]);

  const push = useCallback((screen: Screen) => {
    setStack((prev) => [...prev, screen]);
  }, []);

  const pop = useCallback((): boolean => {
    let popped = false;
    setStack((prev) => {
      if (prev.length > 1) {
        popped = true;
        return prev.slice(0, -1);
      }
      return prev;
    });
    return popped;
  }, []);

  const replace = useCallback((screen: Screen) => {
    setStack((prev) => {
      const next = [...prev];
      if (next.length > 0) {
        next[next.length - 1] = screen;
        return next;
      }
      return [screen];
    });
  }, []);

  const reset = useCallback((screen: Screen) => {
    setStack([screen]);
  }, []);

  const current = stack[stack.length - 1] ?? initialScreen;

  const value = useMemo<NavigationContextType>(
    () => ({
      current,
      stack,
      canGoBack: stack.length > 1,
      push,
      pop,
      replace,
      reset,
    }),
    [current, stack, push, pop, replace, reset]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
