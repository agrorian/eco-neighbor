// src/components/layout/Layout.tsx
// ── v2.0.0: TestEnvironmentBanner added above all content ────────────────────
// Banner is fixed at top (z-index 9999), so content needs 36px top padding
// when in test environment to prevent content hiding behind the banner.

import { ReactNode, useEffect } from 'react';
import MobileNav from './MobileNav';
import FloatingBugButton from '@/components/FloatingBugButton';
import DesktopSidebar from './DesktopSidebar';
import TestEnvironmentBanner from './TestEnvironmentBanner';
import { useUserStore } from '@/store/user';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import InboxBell from '@/components/InboxBell';
import { supabase, supabaseTest } from '@/lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useUserStore();
  const { isTestEnvironment } = useEnvironment();

  // ── Global last_seen updater — runs app-wide ──────────────────────────────
  // Uses correct schema client based on user's environment
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const client = user.environment === 'test' ? supabaseTest : supabase;

    const updateSeen = () => {
      client.rpc('update_last_seen', { uid: userId }).then(() => {});
    };
    updateSeen();
    const interval = setInterval(updateSeen, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id, user?.environment]);

  if (!user) return <>{children}</>;

  // When in test environment, push all content down 36px to clear the banner
  const bannerOffset = isTestEnvironment ? '36px' : '0px';

  return (
    <div className="min-h-screen bg-enb-surface">
      {/* ── Test environment amber banner — fixed, above everything ─────────── */}
      <TestEnvironmentBanner />

      <DesktopSidebar />
      {/* ml-72 = 288px matches the wider sidebar w-72 */}
      <div className="md:ml-72 transition-all duration-300" style={{ paddingTop: bannerOffset }}>
        {/* Top bar with inbox bell — mobile only (desktop has sidebar) */}
        <div className="md:hidden flex justify-end items-center px-4 pt-3 pb-1">
          <InboxBell />
        </div>
        <main className="p-4 md:p-6 pb-24 md:pb-8 max-w-5xl mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
      <FloatingBugButton />
    </div>
  );
}
