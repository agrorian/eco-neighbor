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
      <div className="md:ml-64 transition-all duration-300">
        {/*
          LAYOUT PHILOSOPHY:
          - Mobile: p-4 (16px), full width
          - Desktop: p-6 (24px), max-w-2xl (672px) centred
            → With 256px sidebar + 24px padding each side, the content
              column is a comfortable reading width. No more vast empty
              gutters on 1366px laptops.
          - max-w-2xl is the sweet spot: wide enough for 2-column grids,
            narrow enough that text lines aren't too long to read.
        */}
        <main className="p-4 md:p-6 pb-24 md:pb-8 max-w-2xl md:mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
      <FloatingBugButton />
    </div>
  );
}
