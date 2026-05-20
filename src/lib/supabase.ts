// src/lib/supabase.ts
// ── ENB DOCTRINE: Two named clients — never mix schemas accidentally ─────────
// supabase → always queries public schema (real/Genesis environment)
// supabaseTest → always queries test schema (development environment)
// getDb() → returns the correct client based on current user environment
//
// SECURITY: auth operations always use the public client regardless of environment.
// Supabase Auth lives in auth.users — it is schema-agnostic and shared.

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
export const supabaseTest = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { ...AUTH_CONFIG, storageKey: 'enb-auth-token-test' },
  db: { schema: 'test' },
});

// ── Environment-aware client selector ────────────────────────────────────────
// Reads from a module-level variable set by setDbEnvironment().
// Components call getDb() — no React hook, no require(), no circular deps.
// App.tsx calls setDbEnvironment() whenever user.environment changes.

let _currentEnvironment: 'real' | 'test' = 'real';

export function setDbEnvironment(env: 'real' | 'test') {
  _currentEnvironment = env;
}

export function getDb() {
  return _currentEnvironment === 'test' ? supabaseTest : supabase;
}
