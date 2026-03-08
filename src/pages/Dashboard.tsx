import { useUserStore } from '@/store/user';
import MemberDashboard from './dashboard/MemberDashboard';
import BusinessDashboard from './dashboard/BusinessDashboard';
import AdminDashboard from './dashboard/AdminDashboard';

export default function Dashboard() {
  const { user } = useUserStore();

  if (!user) return null;

  switch (user.role) {
    case 'business':
      return <BusinessDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <MemberDashboard />;
  }
}
