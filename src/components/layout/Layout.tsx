import { ReactNode } from 'react';
import MobileNav from './MobileNav';
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
        <main className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
