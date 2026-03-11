import { useUserStore } from '@/store/user';
import MemberDashboard from './dashboard/MemberDashboard';
import BusinessDashboard from './dashboard/BusinessDashboard';

// The home route `/` always shows the member experience regardless of role.
// Admin-specific screens live under /admin/* only.
// Admins access admin panel via the "Admin Panel" toggle in the sidebar.
export default function Dashboard() {
  const { user } = useUserStore();
  if (!user) return null;

  if (user.role === 'business') return <BusinessDashboard />;
  return <MemberDashboard />;
}
