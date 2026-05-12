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
    // ── ENB DOCTRINE: Guard user.id — never update with undefined ────────────
    // Depend on user?.id not user — prevents re-running on every store update
    if (!user?.id) return;
    const userId = user.id; // capture in closure so it never goes undefined mid-interval
    const updateSeen = () => {
      supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId)
        .then(() => {});
    };
    updateSeen();
    const interval = setInterval(updateSeen, 30000);
    window.addEventListener('focus', updateSeen);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateSeen);
    };
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
