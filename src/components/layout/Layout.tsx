import { ReactNode } from 'react';
import MobileNav from './MobileNav';
import FloatingBugButton from '@/components/FloatingBugButton';
import DesktopSidebar from './DesktopSidebar';
import { useUserStore } from '@/store/user';

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
        {/*
          max-w-5xl = 1024px content column, centred with mx-auto.
          Matches admin panel width for consistent feel across all screens.
          Wide enough for 2-column grids, narrow enough to avoid stretch.
        */}
        <main className="p-4 md:p-6 pb-24 md:pb-8 max-w-5xl mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
      <FloatingBugButton />
    </div>
  );
}
