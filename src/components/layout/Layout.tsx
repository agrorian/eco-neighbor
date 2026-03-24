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
      {/* ml-72 = 288px — matches the wider sidebar */}
      <div className="md:ml-72 transition-all duration-300">
        {/*
          max-w-4xl = 896px content.
          On a 1366px screen: 288px sidebar + 896px content + ~180px breathing room.
          Fills the screen comfortably without stretching too wide.
        */}
        <main className="p-4 md:p-6 pb-24 md:pb-8 max-w-4xl md:mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
      <FloatingBugButton />
    </div>
  );
}
