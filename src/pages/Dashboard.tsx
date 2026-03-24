import { useUserStore } from '@/store/user';
import MemberDashboard from './dashboard/MemberDashboard';
import BusinessDashboard from './dashboard/BusinessDashboard';

// `/` always shows the member experience for ALL roles including business.
// Business Admin panel lives at /business (accessed via the Business Admin toggle).
// Admin panel lives at /admin/* (accessed via Admin Panel toggle).
export default function Dashboard() {
  const { user } = useUserStore();
  if (!user) return null;
  return <MemberDashboard />;
}
