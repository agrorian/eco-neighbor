import { ReactNode } from 'react';
import MobileNav from './MobileNav';
import FloatingBugButton from '@/components/FloatingBugButton';
import DesktopSidebar from './DesktopSidebar';
import { useUserStore } from '@/store/user';
import InboxBell from '@/components/InboxBell';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useUserStore();
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
