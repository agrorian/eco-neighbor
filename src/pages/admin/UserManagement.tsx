import { useState } from 'react';
import { Search, MoreVertical, User, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const USERS = [
  { id: 1, name: 'Sarah Jenkins', email: 'sarah.j@example.com', role: 'User', status: 'Active', rep: 98, enb: 1500 },
  { id: 2, name: 'Mike Thompson', email: 'mike.t@example.com', role: 'User', status: 'Suspended', rep: 45, enb: 200 },
  { id: 3, name: 'Admin User', email: 'admin@eco-neighbor.com', role: 'Admin', status: 'Active', rep: 999, enb: 50000 },
];

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState(USERS);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">User Management</h1>
          <p className="text-sm text-enb-text-secondary">Manage accounts and permissions</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search users..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500">User</th>
              <th className="px-6 py-4 font-medium text-gray-500">Role</th>
              <th className="px-6 py-4 font-medium text-gray-500">Status</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-right">Reputation</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-right">Balance</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-enb-text-primary">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono">{user.rep}</td>
                <td className="px-6 py-4 text-right font-mono">{user.enb} ENB</td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <User className="w-4 h-4 mr-2" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Shield className="w-4 h-4 mr-2" /> Adjust Rep Score
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RefreshCw className="w-4 h-4 mr-2" /> Reset Wallet
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Suspend Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
