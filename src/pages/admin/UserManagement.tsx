import { useState, useEffect } from 'react';
import { Search, Zap, MoreVertical, User, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface DBUser {
  id: string; full_name: string; email: string; role: string;
  rep_score: number; enb_local_bal: number; tier: string;
  whatsapp_number?: string; neighbourhood?: string; is_active: boolean;
}

export default function UserManagement() {
  const { user: adminUser } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [airdropTarget, setAirdropTarget] = useState<DBUser | null>(null);
  const [airdropAmount, setAirdropAmount] = useState('');
  const [airdropReason, setAirdropReason] = useState('');
  const [airdropping, setAirdropping] = useState(false);
  const [airdropSuccess, setAirdropSuccess] = useState('');
  const [airdropError, setAirdropError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, rep_score, enb_local_bal, tier, whatsapp_number, neighbourhood, is_active')
      .order('rep_score', { ascending: false });
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  const handleAirdrop = async () => {
    if (!adminUser || !airdropTarget || !airdropAmount || !airdropReason) return;
    setAirdropping(true);
    setAirdropError('');
    try {
      const { data, error } = await supabase.rpc('airdrop_enb', {
        p_admin_id: adminUser.id,
        p_target_user_id: airdropTarget.id,
        p_amount: parseFloat(airdropAmount),
        p_reason: airdropReason,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Airdrop failed');
      setAirdropSuccess(`✅ ${parseFloat(airdropAmount).toLocaleString()} ENB sent to ${airdropTarget.full_name}`);
      setAirdropAmount(''); setAirdropReason('');
      fetchUsers();
      setTimeout(() => { setAirdropTarget(null); setAirdropSuccess(''); }, 2000);
    } catch (err: any) {
      setAirdropError(err.message || 'Airdrop failed');
    } finally {
      setAirdropping(false);
    }
  };

  const handleToggleActive = async (u: DBUser) => {
    const { error } = await supabase.from('users').update({ is_active: !u.is_active }).eq('id', u.id);
    if (!error) fetchUsers();
  };

  const handleChangeRole = async (u: DBUser, newRole: string) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', u.id);
    if (!error) fetchUsers();
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800', founder: 'bg-enb-gold/10 text-amber-700',
    moderator: 'bg-blue-100 text-blue-800', organiser: 'bg-teal-100 text-teal-800',
    business: 'bg-pink-100 text-pink-800', member: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">User Management</h1>
          <p className="text-sm text-enb-text-secondary">{users.length} total members</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input placeholder="Search users..." className="pl-9" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 font-medium text-gray-500">User</th>
                <th className="px-5 py-4 font-medium text-gray-500">Role</th>
                <th className="px-5 py-4 font-medium text-gray-500">Tier</th>
                <th className="px-5 py-4 font-medium text-gray-500 text-right">Rep</th>
                <th className="px-5 py-4 font-medium text-gray-500 text-right">ENB Balance</th>
                <th className="px-5 py-4 font-medium text-gray-500 text-right">Status</th>
                <th className="px-5 py-4 font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-enb-text-primary">{u.full_name || '—'}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                        {u.neighbourhood && <div className="text-xs text-gray-300">{u.neighbourhood}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {u.tier}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm">{(u.rep_score || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm">{(u.enb_local_bal || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active !== false ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setAirdropTarget(u)}>
                          <Zap className="w-4 h-4 mr-2 text-enb-gold" /> Airdrop ENB
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeRole(u, u.role === 'moderator' ? 'member' : 'moderator')}>
                          <Shield className="w-4 h-4 mr-2" />
                          {u.role === 'moderator' ? 'Remove Moderator' : 'Make Moderator'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeRole(u, u.role === 'admin' ? 'member' : 'admin')}>
                          <User className="w-4 h-4 mr-2" />
                          {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(u)} className={u.is_active !== false ? 'text-red-600' : 'text-green-600'}>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          {u.is_active !== false ? 'Suspend Account' : 'Reactivate Account'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-enb-text-secondary">No users found.</div>
          )}
        </div>
      )}

      {/* Airdrop Modal */}
      <Dialog open={!!airdropTarget} onOpenChange={(open) => !open && setAirdropTarget(null)}>
        <DialogContent className="max-w-sm">
          <div className="space-y-4 p-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-enb-gold/10 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-enb-gold" />
              </div>
              <div>
                <h3 className="font-bold text-enb-text-primary">Airdrop ENB</h3>
                <p className="text-xs text-gray-500">To: {airdropTarget?.full_name || airdropTarget?.email}</p>
              </div>
            </div>

            {airdropSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 text-center font-medium">
                {airdropSuccess}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">ENB Amount</label>
                    <Input type="number" value={airdropAmount} onChange={(e) => setAirdropAmount(e.target.value)}
                      placeholder="e.g. 1000" className="mt-1 font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</label>
                    <Input value={airdropReason} onChange={(e) => setAirdropReason(e.target.value)}
                      placeholder="e.g. Community event bonus" className="mt-1" />
                  </div>
                </div>
                {airdropError && <p className="text-sm text-red-500">{airdropError}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAirdropTarget(null)} className="flex-1">Cancel</Button>
                  <Button onClick={handleAirdrop} disabled={!airdropAmount || !airdropReason || airdropping}
                    className="flex-1 bg-enb-gold hover:bg-enb-gold/90 text-white">
                    {airdropping ? <Loader2 className="w-4 h-4 animate-spin" /> : `Send ${parseFloat(airdropAmount || '0').toLocaleString()} ENB`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
