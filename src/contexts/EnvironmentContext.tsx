// src/contexts/EnvironmentContext.tsx
// ── ENB DOCTRINE: Single environment context — one read path, one write path ─
// This context provides environment awareness to all components.
// REAL environment → queries public schema, no banner
// TEST environment → queries test schema, amber banner on every screen
// Super admin can toggle between environments via Admin Panel sidebar.
// Environment resets to 'real' on every new login (safety default).

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useUserStore } from '@/store/user';
import { setDbEnvironment } from '@/lib/supabase';

export type Environment = 'real' | 'test';

interface EnvironmentContextValue {
  environment: Environment;
  isTestEnvironment: boolean;
  setEnvironment: (env: Environment) => void;
  toggleEnvironment: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextValue>({
  environment: 'real',
  isTestEnvironment: false,
  setEnvironment: () => {},
  toggleEnvironment: () => {},
});

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  // ── ENB DOCTRINE: Always start in 'real' — never accidentally in test ────
  const [environment, setEnvironmentState] = useState<Environment>('real');

  const setEnvironment = useCallback((env: Environment) => {
    setEnvironmentState(env);
    setDbEnvironment(env);
    // Sync to user store
    const { setUser } = useUserStore.getState();
    setUser(prev => prev ? { ...prev, environment: env } : prev);
  }, []);

  const toggleEnvironment = useCallback(() => {
    setEnvironment(environment === 'real' ? 'test' : 'real');
  }, [environment, setEnvironment]);

  return (
    <EnvironmentContext.Provider value={{
      environment,
      isTestEnvironment: environment === 'test',
      setEnvironment,
      toggleEnvironment,
    }}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  return useContext(EnvironmentContext);
}
