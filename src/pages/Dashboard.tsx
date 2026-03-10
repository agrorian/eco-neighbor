import { useUserStore } from '@/store/user';
import MemberDashboard from './dashboard/MemberDashboard';
import BusinessDashboard from './dashboard/BusinessDashboard';
import AdminDashboard from './dashboard/AdminDashboard';

export default function Dashboard() {
  const { user } = useUserStore();
  if (!user) return null;

  // Admin and business users still see their respective dashboards,
  // but the bottom nav gives everyone access to all member features too.
  switch (user.role) {
    case 'business':
      return <BusinessDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <MemberDashboard />;
  }
}
