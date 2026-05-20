import { useState, useEffect, useMemo } from 'react';
import { Search, Zap, MoreVertical, User, Shield, AlertTriangle, Loader2, CheckCircle, Clock, XCircle, ExternalLink, Pencil, Save, X, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useUserStore, isSuperAdmin as checkSuperAdmin } from '@/store/user';
import LocationPicker, { LocationValue } from '@/components/LocationPicker';
import { PROFESSIONS, USER_TIERS, USER_ROLES } from '@/lib/constants';

interface DBUser {
  id: string; full_name: string; email: string; role: string;
  rep_score: number; enb_local_bal: number; tier: string;
  whatsapp_number?: string; neighbourhood?: string; city?: string; profession?: string;
  wallet_address?: string; is_active: boolean;
  cnic_number?: string; cnic_photo_url?: string; cnic_verified?: boolean; cnic_submitted_at?: string;
  joined_at?: string; updated_at?: string;
}

export default function UserManagement() {
  const { user: adminUser, setUser } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [airdropTarget, setAirdropTarget] = useState<DBUser | null>(null);
  const [airdropAmount, setAirdropAmount] = useState('');
  const [airdropReason, setAirdropReason] = useState('');
  const [airdropping, setAirdropping] = useState(false);
  const [airdropSuccess, setAirdropSuccess] = useState('');
  const [airdropError, setAirdropError] = useState('');
  const [verifyTarget, setVerifyTarget] = useState<DBUser | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState('');

  // ── Delete Account ───────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<DBUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Edit Profile ────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<DBUser | null>(null);
  const [editForm, setEditForm] = useState<Partial<DBUser>>({});
  const [editLocation, setEditLocation] = useState<LocationValue>({
    country: '', countryCode: '', province: '', city: '', neighbourhood: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // ── Sort state ────────────────────────────────────────────────────────────
  type SortField = 'serial' | 'full_name' | 'role' | 'tier' | 'rep_score' | 'enb_local_bal' | 'cnic_verified' | 'is_active' | 'joined_at';
  const [sortField, setSortField] = useState<SortField>('rep_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'full_name' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-30 ml-1 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 inline text-enb-green" />
      : <ChevronDown className="w-3 h-3 ml-1 inline text-enb-green" />;
  };

  const openEdit = (u: DBUser) => {
    setEditTarget(u);
    setEditForm({
      full_name:       u.full_name || '',
      profession:      u.profession || '',
      whatsapp_number: u.whatsapp_number || '',
      wallet_address:  u.wallet_address || '',
      role:            u.role || 'member',
      tier:            u.tier || 'Newcomer',
      cnic_verified:   u.cnic_verified || false,
      is_active:       u.is_active !== false,
    });
    // Parse neighbourhood back into location — neighbourhood field stores "Neighbourhood, City, Province, Country"
    // For simplicity, pre-fill neighbourhood from existing data
    setEditLocation({
      country:      '',
      countryCode:  '',
      province:     '',
      city:         '',
      neighbourhood: u.neighbourhood || '',
    });
    setSaveError('');
    setSaveSuccess('');
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError('');
    // Build neighbourhood string from location picker
    const locationParts = [
      editLocation.neighbourhood,
      editLocation.city,
      editLocation.province,
      editLocation.country,
    ].filter(Boolean);
    const neighbourhoodStr = locationParts.length > 0
      ? locationParts.join(', ')
      : editTarget.neighbourhood || null;

    const updatedFields = {
      full_name:       editForm.full_name?.trim() || null,
      neighbourhood:   neighbourhoodStr,
      city:            editLocation.city || editTarget.city || null,
      profession:      editForm.profession?.trim() || null,
      whatsapp_number: editForm.whatsapp_number?.trim() || null,
      wallet_address:  editForm.wallet_address?.trim() || null,
      role:            editForm.role,
      tier:            editForm.tier,
      cnic_verified:   editForm.cnic_verified,
      is_active:       editForm.is_active,
    };

    // ── ENB DOCTRINE: Admin updates to other users' rows MUST use a SECURITY DEFINER RPC.
    // Direct .update() is blocked by RLS (anon key — each user can only update their own row).
    // The RPC runs with elevated privileges, bypassing RLS safely with an internal auth check.
    const { error } = await supabase.rpc('admin_update_user_profile', {
      p_target_id:    editTarget.id,
      p_full_name:    updatedFields.full_name    ?? null,
      p_neighbourhood: updatedFields.neighbourhood ?? null,
      p_city:         updatedFields.city          ?? null,
      p_profession:   updatedFields.profession    ?? null,
      p_whatsapp:     updatedFields.whatsapp_number ?? null,
      p_wallet:       updatedFields.wallet_address  ?? null,
      p_role:         updatedFields.role          ?? 'member',
      p_tier:         updatedFields.tier          ?? 'Newcomer',
      p_cnic_verified: updatedFields.cnic_verified ?? false,
      p_is_active:    updatedFields.is_active     ?? true,
    });
    setSaving(false);
    if (error) { setSaveError(error.message); return; }

    // Optimistically update local state immediately so list reflects change without waiting for refetch
    setUsers(prev => prev.map(u =>
      u.id === editTarget.id ? { ...u, ...updatedFields } : u
    ));

    setSaveSuccess('✅ Profile updated successfully');
    await fetchUsers();
    setTimeout(() => { setEditTarget(null); setSaveSuccess(''); }, 1500);
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, rep_score, enb_local_bal, tier, whatsapp_number, neighbourhood, city, profession, wallet_address, is_active, cnic_number, cnic_photo_url, cnic_verified, cnic_submitted_at, joined_at, updated_at')
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
    // RLS blocks direct update on other users — must use RPC
    const { error } = await supabase.rpc('admin_update_user_profile', {
      p_target_id:     u.id,
      p_full_name:     u.full_name ?? null,
      p_neighbourhood: u.neighbourhood ?? null,
      p_city:          (u as any).city ?? null,
      p_profession:    u.profession ?? null,
      p_whatsapp:      u.whatsapp_number ?? null,
      p_wallet:        u.wallet_address ?? null,
      p_role:          u.role ?? 'member',
      p_tier:          u.tier ?? 'Newcomer',
      p_cnic_verified: u.cnic_verified ?? false,
      p_is_active:     !u.is_active,
    });
    if (!error) fetchUsers();
  };

  const handleChangeRole = async (u: DBUser, newRole: string) => {
    const oldRole = u.role;
    // RLS blocks direct update on other users — must use RPC
    const { error } = await supabase.rpc('admin_update_user_profile', {
      p_target_id:     u.id,
      p_full_name:     u.full_name ?? null,
      p_neighbourhood: u.neighbourhood ?? null,
      p_city:          (u as any).city ?? null,
      p_profession:    u.profession ?? null,
      p_whatsapp:      u.whatsapp_number ?? null,
      p_wallet:        u.wallet_address ?? null,
      p_role:          newRole,
      p_tier:          u.tier ?? 'Newcomer',
      p_cnic_verified: u.cnic_verified ?? false,
      p_is_active:     u.is_active ?? true,
    });
    if (error) return;
    // ── ENB DOCTRINE: Sync store if admin changed their own role ─────────────
    // Note: JWT app_metadata does not update until re-login (Phase 2 fix).
    // Functional update — never spread stale adminUser closure.
    if (adminUser && u.id === adminUser.id) {
      setUser((prev: any) => prev ? { ...prev, role: newRole as any } : prev);
    }
    // Write audit record — never lose the trail of who was changed to what and when
    await supabase.from('role_change_audit').insert({
      user_id:    u.id,
      changed_by: adminUser?.id || null,
      old_role:   oldRole,
      new_role:   newRole,
    }).then(({ error: auditErr }) => {
      if (auditErr) console.warn('Audit log write failed (non-critical):', auditErr.message);
    });
    fetchUsers();
  };

  const handleVerify = async () => {
    if (!verifyTarget) return;
    setVerifying(true);
    const { error } = await supabase
      .from('users')
      .update({ cnic_verified: true })
      .eq('id', verifyTarget.id);
    setVerifying(false);
    if (!error) {
      setVerifySuccess('✅ Identity verified successfully');
      fetchUsers();
      setTimeout(() => { setVerifyTarget(null); setVerifySuccess(''); }, 2000);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      // Step 1: delete from public.users (cascades to all related rows)
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', deleteTarget.id);
      if (dbError) throw dbError;

      // Step 2: delete from auth.users via SECURITY DEFINER RPC
      const { error: authError } = await supabase.rpc('admin_delete_auth_user', {
        p_user_id: deleteTarget.id,
      });
      if (authError) throw authError;

      setDeleteTarget(null);
      setDeleteConfirmText('');
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Build serial number map keyed by user ID — ordered by join date (joined_at ASC)
  const serialMap = useMemo(() => {
    const sorted = [...users].sort((a, b) =>
      (a.joined_at || '').localeCompare(b.joined_at || '')
    );
    const map: Record<string, number> = {};
    sorted.forEach((u, i) => { map[u.id] = i + 1; });
    return map;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const filtered = users.filter(u =>
      (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === 'serial') {
        aVal = serialMap[a.id] ?? 999;
        bVal = serialMap[b.id] ?? 999;
      } else if (sortField === 'full_name') {
        aVal = (a.full_name || a.email || '').toLowerCase();
        bVal = (b.full_name || b.email || '').toLowerCase();
      } else if (sortField === 'role') {
        const roleOrder: Record<string, number> = { super_admin: 0, admin: 1, founder: 2, moderator: 3, onboarding_team: 4, business: 5, member: 6 };
        aVal = roleOrder[a.role] ?? 99;
        bVal = roleOrder[b.role] ?? 99;
      } else if (sortField === 'tier') {
        const tierOrder: Record<string, number> = { 'Founder Tier': 0, Pillar: 1, Guardian: 2, Helper: 3, Newcomer: 4 };
        aVal = tierOrder[a.tier] ?? 99;
        bVal = tierOrder[b.tier] ?? 99;
      } else if (sortField === 'cnic_verified') {
        aVal = a.cnic_submitted_at ? (a.cnic_verified ? 0 : 1) : 2;
        bVal = b.cnic_submitted_at ? (b.cnic_verified ? 0 : 1) : 2;
      } else if (sortField === 'is_active') {
        aVal = a.is_active !== false ? 0 : 1;
        bVal = b.is_active !== false ? 0 : 1;
      } else if (sortField === 'joined_at') {
        aVal = a.joined_at || '';
        bVal = b.joined_at || '';
      } else {
        aVal = (a as any)[sortField] ?? 0;
        bVal = (b as any)[sortField] ?? 0;
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, searchTerm, sortField, sortDir, serialMap]);

  const ROLE_COLORS: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-800', admin: 'bg-purple-100 text-purple-800',
    founder: 'bg-enb-gold/10 text-amber-700', moderator: 'bg-blue-100 text-blue-800',
    onboarding_team: 'bg-teal-100 text-teal-800', business: 'bg-pink-100 text-pink-800',
    member: 'bg-gray-100 text-gray-700',
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-2 py-4 w-[40px] text-center">
                  <button onClick={() => handleSort('serial')} className="font-medium text-gray-500 hover:text-enb-green transition-colors text-xs">
                    #<SortIcon field="serial" />
                  </button>
                </th>
                <th className="px-3 py-4 w-[200px]">
                  <button onClick={() => handleSort('full_name')} className="font-medium text-gray-500 hover:text-enb-green transition-colors text-xs">
                    User<SortIcon field="full_name" />
                  </button>
                </th>
                <th className="px-2 py-4 w-[110px]">
                  <button onClick={() => handleSort('role')} className="font-medium text-gray-500 hover:text-enb-green transition-colors text-xs">
                    Role<SortIcon field="role" />
                  </button>
                </th>
                <th className="px-2 py-4 w-[90px]">
                  <button onClick={() => handleSort('tier')} className="font-medium text-gray-500 hover:text-enb-green transition-colors text-xs">
                    Tier<SortIcon field="tier" />
                  </button>
                </th>
                <th className="px-2 py-4 text-right w-[65px]">
                  <button onClick={() => handleSort('rep_score')} className="font-medium text-gray-500 hover:text-enb-green transition-colors text-xs">
                    Rep<SortIcon field="rep_score" />
                  </button>
                </th>
                <th className="px-2 py-4 text-right w-[90px]">
                  <button onClick={() => handleSort('enb_local_bal')} className="font-medium text-gray-500 hover:text-enb-green transition-colors text-xs">
                    ENB Bal<SortIcon field="enb_local_bal" />
                  </button>
                </th>
                <th className="px-2 py-4 text-center w-[80px]">
                  <button onClick={() => handleSort('cnic_verified')} className="font-medium text-gray-500 hover:text-enb-green transition-colors text-xs">
                    Identity<SortIcon field="cnic_verified" />
                  </button>
                </th>
                <th className="px-2 py-4 text-center w-[70px]">
                  <button onClick={() => handleSort('is_active')} className="font-medium text-gray-500 hover:text-enb-green transition-colors text-xs">
                    Status<SortIcon field="is_active" />
                  </button>
                </th>
                <th className="px-2 py-4 text-right w-[55px] font-medium text-gray-500 text-xs">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-enb-green/8 text-enb-green text-xs font-bold">
                      #{serialMap[u.id] ?? "—"}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs shrink-0">
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-enb-text-primary text-sm truncate">{u.full_name || '—'}</div>
                        <div className="text-xs text-gray-400 truncate">{u.email}</div>
                        {u.neighbourhood && <div className="text-xs text-gray-300 truncate">{u.neighbourhood}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {u.tier}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm">{(u.rep_score || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-mono text-sm">{(u.enb_local_bal || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-center">
                    {u.cnic_submitted_at ? (
                      u.cnic_verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-600">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-400">
                        <XCircle className="w-3 h-3" /> None
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active !== false ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEdit(u)} className="text-enb-green font-medium">
                          <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                        </DropdownMenuItem>
                        {u.cnic_submitted_at && !u.cnic_verified && (
                          <DropdownMenuItem onClick={() => setVerifyTarget(u)} className="text-enb-green">
                            <CheckCircle className="w-4 h-4 mr-2" /> Verify Identity
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setAirdropTarget(u)}>
                          <Zap className="w-4 h-4 mr-2 text-enb-gold" /> Airdrop ENB
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeRole(u, u.role === 'moderator' ? 'member' : 'moderator')}>
                          <Shield className="w-4 h-4 mr-2" />
                          {u.role === 'moderator' ? 'Remove Moderator' : 'Make Moderator'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeRole(u, ['admin','super_admin'].includes(u.role) ? 'member' : 'admin')}>
                          <User className="w-4 h-4 mr-2" />
                          {['admin','super_admin'].includes(u.role) ? 'Remove Admin' : 'Make Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(u)} className={u.is_active !== false ? 'text-red-600' : 'text-green-600'}>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          {u.is_active !== false ? 'Suspend Account' : 'Reactivate Account'}
                        </DropdownMenuItem>
                        {adminUser?.role === 'super_admin' && (
                          <DropdownMenuItem
                            onClick={() => { setDeleteTarget(u); setDeleteConfirmText(''); setDeleteError(''); }}
                            className="text-red-600 font-medium focus:text-red-700 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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

      {/* Identity Verification Modal */}
      <Dialog open={!!verifyTarget} onOpenChange={(open) => !open && setVerifyTarget(null)}>
        <DialogContent className="max-w-sm">
          <div className="space-y-4 p-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-enb-green/10 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-enb-green" />
              </div>
              <div>
                <h3 className="font-bold text-enb-text-primary">Verify Identity</h3>
                <p className="text-xs text-gray-500">{verifyTarget?.full_name}</p>
              </div>
            </div>

            {verifySuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 text-center font-medium">
                {verifySuccess}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
                  <div><span className="font-medium text-gray-500">ID Number:</span> <span className="font-mono text-enb-text-primary">{verifyTarget?.cnic_number || '—'}</span></div>
                  <div><span className="font-medium text-gray-500">Submitted:</span> <span>{verifyTarget?.cnic_submitted_at ? new Date(verifyTarget.cnic_submitted_at).toLocaleDateString('en-PK') : '—'}</span></div>
                  <div><span className="font-medium text-gray-500">Neighbourhood:</span> <span>{verifyTarget?.neighbourhood}</span></div>
                </div>
                {verifyTarget?.cnic_photo_url && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">ID Photo</p>
                    <a href={verifyTarget.cnic_photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={verifyTarget.cnic_photo_url} alt="CNIC" className="w-full h-36 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
                      <p className="text-xs text-center text-enb-green mt-1 flex items-center justify-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Open full size
                      </p>
                    </a>
                  </div>
                )}
                {!verifyTarget?.cnic_photo_url && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                    ⚠️ No ID photo submitted. International member or photo upload failed.
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  By clicking Verify, you confirm you have reviewed the ID and it matches the user's profile.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setVerifyTarget(null)} className="flex-1">Cancel</Button>
                  <Button onClick={handleVerify} disabled={verifying}
                    className="flex-1 bg-enb-green hover:bg-enb-green/90 text-white">
                    {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Mark as Verified'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Edit Profile Modal */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <div className="space-y-4 p-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-enb-green/10 rounded-full flex items-center justify-center">
                <Pencil className="w-5 h-5 text-enb-green" />
              </div>
              <div>
                <h3 className="font-bold text-enb-text-primary">Edit Profile</h3>
                <p className="text-xs text-gray-500">{editTarget?.email}</p>
              </div>
            </div>

            {saveSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 text-center font-medium">
                {saveSuccess}
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">

                {/* Personal Info */}
                <p className="text-[10px] font-bold text-enb-text-secondary uppercase tracking-wider pt-1">Personal Info</p>

                <div>
                  <label className="text-xs font-medium text-gray-500">Full Name</label>
                  <Input value={editForm.full_name || ''} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Full name" className="mt-1" />
                </div>

                {/* Location Picker */}
                <LocationPicker
                  value={editLocation}
                  onChange={setEditLocation}
                />

                <div>
                  <label className="text-xs font-medium text-gray-500">Profession</label>
                  <select value={editForm.profession || ''}
                    onChange={e => setEditForm(f => ({ ...f, profession: e.target.value }))}
                    className="mt-1 w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-enb-green text-enb-text-primary">
                    <option value="">Select profession</option>
                    {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">WhatsApp Number</label>
                  <Input value={editForm.whatsapp_number || ''} onChange={e => setEditForm(f => ({ ...f, whatsapp_number: e.target.value }))}
                    placeholder="e.g. 03001234567" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Solana Wallet Address</label>
                  <Input value={editForm.wallet_address || ''} onChange={e => setEditForm(f => ({ ...f, wallet_address: e.target.value }))}
                    placeholder="Solana public key" className="mt-1 font-mono text-xs" />
                </div>

                {/* Role & Tier */}
                <p className="text-[10px] font-bold text-enb-text-secondary uppercase tracking-wider pt-1">Role & Tier</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Role</label>
                    <select value={editForm.role || 'member'}
                      onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                      className="mt-1 w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-enb-green text-enb-text-primary">
                      {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Tier</label>
                    <select value={editForm.tier || 'Newcomer'}
                      onChange={e => setEditForm(f => ({ ...f, tier: e.target.value }))}
                      className="mt-1 w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-enb-green text-enb-text-primary">
                      {USER_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Status & Verification */}
                <p className="text-[10px] font-bold text-enb-text-secondary uppercase tracking-wider pt-1">Status</p>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.is_active !== false}
                      onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-enb-green rounded" />
                    <span className="text-sm text-enb-text-primary">Account Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!editForm.cnic_verified}
                      onChange={e => setEditForm(f => ({ ...f, cnic_verified: e.target.checked }))}
                      className="w-4 h-4 accent-enb-green rounded" />
                    <span className="text-sm text-enb-text-primary">Identity Verified</span>
                  </label>
                </div>

                {saveError && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-2">{saveError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" onClick={() => setEditTarget(null)} className="flex-1">
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={saving}
                    className="flex-1 bg-enb-green hover:bg-enb-green/90 text-white">
                    {saving
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><Save className="w-4 h-4 mr-1" /> Save Changes</>
                    }
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(''); setDeleteError(''); } }}>
        <DialogContent className="max-w-sm">
          <div className="space-y-4 p-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-enb-text-primary">Delete Account</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1 text-sm">
              <div><span className="font-medium text-gray-500">Name:</span> <span className="font-semibold text-enb-text-primary">{deleteTarget?.full_name || '—'}</span></div>
              <div><span className="font-medium text-gray-500">Email:</span> <span className="font-mono text-red-700">{deleteTarget?.email}</span></div>
              <div><span className="font-medium text-gray-500">ENB Balance:</span> <span>{(deleteTarget?.enb_local_bal || 0).toLocaleString()} ENB</span></div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              This will permanently delete the user's account, profile, submissions, and all associated data from the database. Their auth login will also be removed.
            </p>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type <span className="font-mono text-red-600">DELETE</span> to confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={e => { setDeleteConfirmText(e.target.value); setDeleteError(''); }}
                placeholder="Type DELETE"
                className="mt-1 font-mono border-red-200 focus:border-red-400"
              />
            </div>

            {deleteError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-2">{deleteError}</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); setDeleteError(''); }} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-1" /> Delete Permanently</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
