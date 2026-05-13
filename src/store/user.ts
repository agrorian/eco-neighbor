import { create } from 'zustand';

export type UserRole = 'member' | 'business' | 'admin' | 'moderator' | 'organiser' | 'founder' | 'super_admin';
export type UserTier = 'Newcomer' | 'Helper' | 'Guardian' | 'Pillar' | 'Founder';

// ── ENB DOCTRINE: Single source of truth for tier thresholds ─────────────────
export function getTier(repScore: number): UserTier {
  if (repScore >= 100000) return 'Founder';
  if (repScore >= 50000)  return 'Pillar';
  if (repScore >= 20000)  return 'Guardian';
  if (repScore >= 5000)   return 'Helper';
  return 'Newcomer';
}

export const TIER_NEXT_THRESHOLD: Record<UserTier, number> = {
  Newcomer: 5000,
  Helper:   20000,
  Guardian: 50000,
  Pillar:   100000,
  Founder:  100000,
};

// ── Single source of truth for isSuperAdmin check ────────────────────────────
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
  setUser: (user: UserState['user'] | ((prev: UserState['user']) => UserState['user'])) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (userOrUpdater) => {
    if (typeof userOrUpdater === 'function') {
      set((state) => ({ user: userOrUpdater(state.user) }));
    } else {
      // ── Phantom guard: never write a user object with empty full_name ──────
      // If full_name is blank but we already have a correct name in the store,
      // keep the existing name. This prevents realtime payload nulls from
      // wiping a correctly loaded full_name and showing the phantom U avatar.
      if (userOrUpdater && !userOrUpdater.full_name) {
        console.trace('[ENB] setUser called with empty full_name — check caller', userOrUpdater);
        set((state) => ({
          user: state.user
            ? { ...userOrUpdater, full_name: state.user.full_name || userOrUpdater.full_name }
            : userOrUpdater,
        }));
      } else {
        set({ user: userOrUpdater });
      }
    }
  },
  logout: () => set({ user: null }),
}));
