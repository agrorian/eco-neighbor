// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const AUTH_CONFIG = {
  persistSession: true,
  storageKey: 'enb-auth-token',
  storage: window.localStorage,
  autoRefreshToken: true,
  detectSessionInUrl: true,
};

// ── Public schema client (real/Genesis environment) ───────────────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: AUTH_CONFIG,
});

// ── Test schema client (development/QA environment) ───────────────────────────
// CRITICAL: Must use same storageKey as supabase client to share the auth session.
// Different storageKey causes unauthenticated requests (auth.uid() = null).
export const supabaseTest = createClient(supabaseUrl, supabaseAnonKey, {
  auth: AUTH_CONFIG,
  db: { schema: 'test' },
});

// ── Environment-aware client selector ────────────────────────────────────────
let _currentEnvironment: 'real' | 'test' = 'real';

export function setDbEnvironment(env: 'real' | 'test') {
  _currentEnvironment = env;
}

export function getDb() {
  return _currentEnvironment === 'test' ? supabaseTest : supabase;
}
