import { create } from 'zustand';

export type UserRole = 'member' | 'business' | 'admin';
export type UserTier = 'Newcomer' | 'Helper' | 'Guardian' | 'Pillar' | 'Founder';

export function getTier(repScore: number): UserTier {
  if (repScore >= 100000) return 'Founder';
  if (repScore >= 50000) return 'Pillar';
  if (repScore >= 20000) return 'Guardian';
  if (repScore >= 5000) return 'Helper';
  return 'Newcomer';
}

interface UserState {
  user: {
    id: string;
    email: string;
    full_name: string;
    neighbourhood: string;
    profession: string;
    enb_local_bal: number;
    rep_score: number;
    tier: UserTier;
    role: UserRole;
    wallet_address?: string;
  } | null;
  setUser: (user: UserState['user']) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));