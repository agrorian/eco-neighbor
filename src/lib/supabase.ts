// src/lib/supabase.ts
// ── ENB DOCTRINE: Two named clients — never mix schemas accidentally ─────────
// supabase → always queries public schema (real/Genesis environment)
// supabaseTest → always queries test schema (development environment)
// getDb() → returns the correct client based on current user environment
//
// SECURITY: auth operations always use the public client regardless of environment.
// Supabase Auth lives in auth.users — it is schema-agnostic and shared.
//
// REALTIME: subscriptions must specify schema explicitly — see App.tsx
// for the global users subscription and individual page subscriptions.

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
  auth: AUTH_CONFIG,
  db: { schema: 'test' },
});

// ── Environment-aware client selector ────────────────────────────────────────
// Import useUserStore lazily to avoid circular dependency at module load time.
// Call getDb() inside component/hook bodies, never at module top level.
export function getDb(): ReturnType<typeof createClient> {
  // Dynamic import of store state (no hook — safe to call outside React)
  const { useUserStore } = require('@/store/user');
  const env = useUserStore.getState().user?.environment;
  return env === 'test' ? supabaseTest : supabase;
}
