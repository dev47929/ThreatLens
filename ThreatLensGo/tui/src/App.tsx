import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { BackendProvider, loadSession, clearSession } from './state/backendState.js';
import { NavigationProvider, useNavigation } from './state/navigation.js';
import { SecuritySessionProvider } from './state/securitySession.js';
import { ThemeProvider } from './state/themeContext.js';
import { backendClient } from './api/backendClient.js';
import {
  LoginScreen,
  MainMenuScreen,
  GitAnalysisScreen,
  TargetUrlScreen,
  SecurityMenuScreen,
  DdosScreen,
  SqliScreen,
  XssScreen,
  ExfilScreen,
  RateLimitScreen,
  ProxyScreen,
  ChatHistoryScreen,
  AgentChatScreen,
  ThemeScreen,
} from './screens/index.js';

export const ScreenRenderer: React.FC = () => {
  const { current } = useNavigation();

  switch (current.type) {
    case 'login':
      return <LoginScreen />;
    case 'mainMenu':
      return <MainMenuScreen />;
    case 'gitAnalysis':
      return <GitAnalysisScreen />;
    case 'targetUrl':
      return <TargetUrlScreen />;
    case 'securityMenu':
      return <SecurityMenuScreen />;
    case 'ddos':
      return <DdosScreen />;
    case 'sqli':
      return <SqliScreen />;
    case 'xss':
      return <XssScreen />;
    case 'exfil':
      return <ExfilScreen />;
    case 'rateLimit':
      return <RateLimitScreen />;
    case 'proxy':
      return <ProxyScreen />;
    case 'chatHistory':
      return <ChatHistoryScreen />;
    case 'theme':
      return <ThemeScreen />;
    case 'agentChat':
      return <AgentChatScreen chatId={current.chatId} initialPrompt={current.initialPrompt} />;
    default: {
      const _exhaustiveCheck: never = current;
      return <LoginScreen />;
    }
  }
};

export const AppContent: React.FC = () => {
  const { replace } = useNavigation();
  const [bootChecked, setBootChecked] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSessionOnBoot() {
      const session = loadSession();
      if (!session || !session.token) {
        if (active) setBootChecked(true);
        return;
      }

      backendClient.setAuthToken(session.token);

      try {
        const pulseRes = await backendClient.pulse().catch(() => null);
        const online = Boolean(pulseRes && (pulseRes.connect === true || pulseRes.status === 'Live'));

        if (!online) {
          // Backend is offline: cannot validate token with getMe()
          if (active) setBootChecked(true);
          return;
        }

        // Validate token with backend
        await backendClient.getMe();
        if (active) {
          replace({ type: 'mainMenu' });
          setBootChecked(true);
        }
      } catch (err: any) {
        const msg = err?.message || '';
        if (msg.includes('401') || msg.includes('Unauthorized')) {
          clearSession();
          backendClient.setAuthToken('');
        }
        if (active) setBootChecked(true);
      }
    }

    checkSessionOnBoot();

    return () => {
      active = false;
    };
  }, [replace]);

  if (!bootChecked) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">
          <Spinner type="dots" /> Initializing ThreatLensGo session...
        </Text>
      </Box>
    );
  }

  return (
    <SecuritySessionProvider>
      <Box flexDirection="column">
        <ScreenRenderer />
      </Box>
    </SecuritySessionProvider>
  );
};

export const App: React.FC = () => {
  return (
    <BackendProvider>
      <ThemeProvider>
        <NavigationProvider initialScreen={{ type: 'login' }}>
          <AppContent />
        </NavigationProvider>
      </ThemeProvider>
    </BackendProvider>
  );
};

export default App;
