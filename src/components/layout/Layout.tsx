import { ReactNode, useEffect } from 'react';
import MobileNav from './MobileNav';
import FloatingBugButton from '@/components/FloatingBugButton';
import DesktopSidebar from './DesktopSidebar';
import { useUserStore } from '@/store/user';
import InboxBell from '@/components/InboxBell';
import { supabase } from '@/lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useUserStore();

  // ── Global last_seen updater — runs app-wide ──────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    // ── Use RPC to bypass triggers that cause USER_UPDATED auth events ────────
    // Direct table UPDATE fires on_users_updated trigger → Supabase fires
    // USER_UPDATED → repeated SIGNED_IN events → phantom account appears.
    // RPC with SECURITY DEFINER bypasses the trigger chain entirely.
    // Interval: 5 minutes. No window.focus listener — that fired too frequently.
    const updateSeen = () => {
      supabase.rpc('update_last_seen', { uid: userId }).then(() => {});
    };
    updateSeen();
    const interval = setInterval(updateSeen, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (!user) return <>{children}</>;
  return (
    <div className="min-h-screen bg-enb-surface">
      <DesktopSidebar />
      {/* ml-72 = 288px matches the wider sidebar w-72 */}
      <div className="md:ml-72 transition-all duration-300">
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
