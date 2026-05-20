// src/contexts/EnvironmentContext.tsx
// ── ENB DOCTRINE: Single environment context — one read path, one write path ─
// This context provides environment awareness to all components.
// REAL environment → queries public schema, no banner
// TEST environment → queries test schema, amber banner on every screen
// Super admin can toggle between environments via Admin Panel sidebar.
// Environment resets to 'real' on every new login (safety default).

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useUserStore } from '@/store/user';
import { setDbEnvironment, supabase, supabaseTest } from '@/lib/supabase';

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

  const setEnvironment = useCallback(async (env: Environment) => {
    setEnvironmentState(env);
    setDbEnvironment(env);

    // ── v2.0.0 FIX: Reload user profile from the correct schema on toggle ──
    // Category C dual-access users exist in both schemas.
    // Switching environment must reload their profile data from the target schema
    // so balances, rep scores and tier reflect that schema's actual values.
    const { user, setUser } = useUserStore.getState();
    if (!user?.id) return;

    const client = env === 'test' ? supabaseTest : supabase;
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      // Preserve environment flag from the toggle, merge rest from DB
      setUser({ ...data,
        id: data.id,
        email: data.email || user.email,
        full_name: data.full_name || user.full_name,
        enb_local_bal: Number(data.enb_local_bal) || 0,
        enb_global_bal: Number(data.enb_global_bal) || 0,
        rep_score: Number(data.rep_score) || 0,
        tier: data.tier || 'Newcomer',
        role: data.role || user.role,
        environment: env,
        is_test_account: data.is_test_account === true,
        lifetime_earned: Number(data.lifetime_earned) || 0,
        cnic_verified: data.cnic_verified === true,
        profile_pic_url: data.profile_pic_url || user.profile_pic_url,
        wallet_address: data.wallet_address || user.wallet_address,
        whatsapp_number: data.whatsapp_number || user.whatsapp_number,
        neighbourhood: data.neighbourhood || user.neighbourhood,
        city: data.city || user.city,
        country_code: data.country_code || user.country_code,
        profession: data.profession || user.profession,
        referred_by: data.referred_by || user.referred_by,
        referral_code: data.referral_code || user.referral_code,
        consecutive_absences: Number(data.consecutive_absences) || 0,
        cnic_number: data.cnic_number || user.cnic_number,
        cnic_photo_url: data.cnic_photo_url || user.cnic_photo_url,
        cnic_submitted_at: data.cnic_submitted_at || user.cnic_submitted_at,
        avg_passenger_rating: Number(data.avg_passenger_rating) || 0,
        total_rides_as_passenger: Number(data.total_rides_as_passenger) || 0,
        is_carpool_rider: data.is_carpool_rider === true,
        avg_carpool_rating: Number(data.avg_carpool_rating) || 0,
        total_carpool_rides: Number(data.total_carpool_rides) || 0,
        trade_types: data.trade_types || [],
        total_verified_jobs: Number(data.total_verified_jobs) || 0,
        avg_job_rating: Number(data.avg_job_rating) || 0,
        total_job_ratings: Number(data.total_job_ratings) || 0,
        trade_availability: data.trade_availability || 'not_set',
        trade_availability_until: data.trade_availability_until || undefined,
        trade_availability_schedule: data.trade_availability_schedule || null,
      });
    } else {
      // Row not found in target schema — just update the environment flag
      if (error) console.warn('[ENB] Profile reload on toggle failed:', error.message);
      setUser(prev => prev ? { ...prev, environment: env } : prev);
    }
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