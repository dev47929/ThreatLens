import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface AttackTargetConfig {
  base_url: string;
  endpoint: string;
  method: string;
  path_params: Record<string, any> | null;
  query_params: Record<string, any> | null;
}

export interface AttackRequestConfig {
  headers: Record<string, string> | null;
  auth: any | null;
  body: any | null;
}

export const DEFAULT_TARGET_CONFIG: AttackTargetConfig = {
  base_url: 'http://localhost:8000',
  endpoint: '/tc-auth/config/pulse',
  method: 'GET',
  path_params: null,
  query_params: null,
};

export const DEFAULT_REQUEST_CONFIG: AttackRequestConfig = {
  headers: null,
  auth: null,
  body: null,
};

export interface SecuritySessionContextType {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  clearTargetUrl: () => void;
  targetConfig: AttackTargetConfig;
  setTargetConfig: (
    target: Partial<AttackTargetConfig> | ((prev: AttackTargetConfig) => AttackTargetConfig)
  ) => void;
  requestConfig: AttackRequestConfig;
  setRequestConfig: (
    request: Partial<AttackRequestConfig> | ((prev: AttackRequestConfig) => AttackRequestConfig)
  ) => void;
  setTargetAndRequest: (target: AttackTargetConfig, request: AttackRequestConfig) => void;
  resetTargetAndRequest: () => void;
}

const SecuritySessionContext = createContext<SecuritySessionContextType | null>(null);

export interface SecuritySessionProviderProps {
  children: React.ReactNode;
}

export function parseRawUrl(raw: string): { base_url: string; endpoint: string } {
  const fallback = raw && raw.trim() !== '' ? raw.trim() : 'http://localhost:8000';
  try {
    const u = new URL(fallback.startsWith('http') ? fallback : `http://${fallback}`);
    return {
      base_url: `${u.protocol}//${u.host}`,
      endpoint: u.pathname && u.pathname !== '' ? u.pathname : '/tc-auth/config/pulse',
    };
  } catch {
    return {
      base_url: 'http://localhost:8000',
      endpoint: '/tc-auth/config/pulse',
    };
  }
}

export const SecuritySessionProvider: React.FC<SecuritySessionProviderProps> = ({ children }) => {
  const [targetConfig, setTargetConfigInternal] = useState<AttackTargetConfig>(DEFAULT_TARGET_CONFIG);
  const [requestConfig, setRequestConfigInternal] = useState<AttackRequestConfig>(DEFAULT_REQUEST_CONFIG);
  const [targetUrl, setTargetUrlState] = useState<string>('http://localhost:8000/tc-auth/config/pulse');

  const setTargetUrl = useCallback((url: string) => {
    const trimmed = url.trim();
    setTargetUrlState(trimmed);
    if (trimmed) {
      const { base_url, endpoint } = parseRawUrl(trimmed);
      setTargetConfigInternal((prev) => ({
        ...prev,
        base_url,
        endpoint,
      }));
    }
  }, []);

  const clearTargetUrl = useCallback(() => {
    setTargetUrlState('');
    setTargetConfigInternal((prev) => ({
      ...prev,
      base_url: '',
      endpoint: '',
    }));
  }, []);

  const setTargetConfig = useCallback(
    (target: Partial<AttackTargetConfig> | ((prev: AttackTargetConfig) => AttackTargetConfig)) => {
      setTargetConfigInternal((prev) => {
        const next = typeof target === 'function' ? target(prev) : { ...prev, ...target };
        setTargetUrlState(`${next.base_url}${next.endpoint}`);
        return next;
      });
    },
    []
  );

  const setRequestConfig = useCallback(
    (request: Partial<AttackRequestConfig> | ((prev: AttackRequestConfig) => AttackRequestConfig)) => {
      setRequestConfigInternal((prev) => {
        return typeof request === 'function' ? request(prev) : { ...prev, ...request };
      });
    },
    []
  );

  const setTargetAndRequest = useCallback((target: AttackTargetConfig, request: AttackRequestConfig) => {
    setTargetConfigInternal(target);
    setRequestConfigInternal(request);
    setTargetUrlState(`${target.base_url}${target.endpoint}`);
  }, []);

  const resetTargetAndRequest = useCallback(() => {
    setTargetConfigInternal(DEFAULT_TARGET_CONFIG);
    setRequestConfigInternal(DEFAULT_REQUEST_CONFIG);
    setTargetUrlState('http://localhost:8000/tc-auth/config/pulse');
  }, []);

  const value = useMemo<SecuritySessionContextType>(
    () => ({
      targetUrl,
      setTargetUrl,
      clearTargetUrl,
      targetConfig,
      setTargetConfig,
      requestConfig,
      setRequestConfig,
      setTargetAndRequest,
      resetTargetAndRequest,
    }),
    [
      targetUrl,
      setTargetUrl,
      clearTargetUrl,
      targetConfig,
      setTargetConfig,
      requestConfig,
      setRequestConfig,
      setTargetAndRequest,
      resetTargetAndRequest,
    ]
  );

  return (
    <SecuritySessionContext.Provider value={value}>
      {children}
    </SecuritySessionContext.Provider>
  );
};

export const useSecuritySession = (): SecuritySessionContextType => {
  const context = useContext(SecuritySessionContext);
  if (!context) {
    return {
      targetUrl: 'http://localhost:8000/tc-auth/config/pulse',
      setTargetUrl: () => {},
      clearTargetUrl: () => {},
      targetConfig: DEFAULT_TARGET_CONFIG,
      setTargetConfig: () => {},
      requestConfig: DEFAULT_REQUEST_CONFIG,
      setRequestConfig: () => {},
      setTargetAndRequest: () => {},
      resetTargetAndRequest: () => {},
    };
  }
  return context;
};

