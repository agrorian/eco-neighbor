import { create } from 'zustand';

export type UserRole = 'member' | 'business' | 'admin' | 'moderator' | 'organiser' | 'founder' | 'super_admin';
export type UserTier = 'Newcomer' | 'Helper' | 'Guardian' | 'Pillar' | 'Founder';

// ── ENB DOCTRINE: Single source of truth for tier thresholds ─────────────────
// These numbers are canonical. Never redefine them in any other file.
// Import TIER_NEXT_THRESHOLD from here wherever a progress bar or tier check is needed.
export function getTier(repScore: number): UserTier {
  if (repScore >= 100000) return 'Founder';
  if (repScore >= 50000)  return 'Pillar';
  if (repScore >= 20000)  return 'Guardian';
  if (repScore >= 5000)   return 'Helper';
  return 'Newcomer';
}

// How many Rep points to reach the NEXT tier from the current one.
// Used for progress bars. Founder is the ceiling — no next tier.
export const TIER_NEXT_THRESHOLD: Record<UserTier, number> = {
  Newcomer: 5000,
  Helper:   20000,
  Guardian: 50000,
  Pillar:   100000,
  Founder:  100000, // ceiling — progress bar shows 100%
};

// ── Single source of truth for isSuperAdmin check ────────────────────────────
// Never inline-check role strings. Import and call this function everywhere.
export function isSuperAdmin(role?: string | null): boolean {
  return role === 'admin' || role === 'super_admin';
}

interface UserState {
  user: {
    id: string;
    email: string;
    full_name: string;
    neighbourhood: string;
    city?: string;
    profession: string;
    enb_local_bal: number;
    enb_global_bal: number;
    rep_score: number;
    tier: UserTier;
    role: UserRole;
    wallet_address?: string;
    whatsapp_number?: string;
    profile_pic_url?: string;
    lifetime_earned?: number;
    referred_by?: string;
    referral_code?: string;
    consecutive_absences?: number;
    cnic_number?: string;
    cnic_photo_url?: string;
    cnic_verified?: boolean;
    cnic_submitted_at?: string;
    country_code?: string;
  } | null;
  setUser: (user: UserState['user']) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
