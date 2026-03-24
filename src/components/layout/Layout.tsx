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
          No max-w + no mx-auto = content fills all available space,
          exactly like the admin panel does with flex-1.
          Padding provides breathing room. No centering, no empty gutters.
        */}
        <main className="p-4 md:p-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
      <FloatingBugButton />
    </div>
  );
}
