// src/pages/admin/org/MembersTab.tsx
// Member Assignment — place users in dept × region × role matrix

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, Users, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  neighbourhood: string | null;
  profile_pic_url: string | null;
}

interface Department { id: string; name: string; icon: string | null; }
interface Region     { id: string; name: string; level: string; }
interface OrgRole    { id: string; name: string; }

interface Membership {
  id: string;
  user_id: string;
  department_id: string;
  region_id: string;
  org_role_id: string | null;
  is_active: boolean;
  notes: string | null;
  assigned_at: string;
  users: { full_name: string; email: string; profile_pic_url: string | null };
  departments: { name: string; icon: string | null };
  regions: { name: string; level: string };
  org_roles: { name: string } | null;
}

function Avatar({ user }: { user: Partial<UserProfile> }) {
  const initials = user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return user.profile_pic_url ? (
    <img src={user.profile_pic_url} alt={user.full_name}
      className="w-8 h-8 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-enb-green/20 flex items-center justify-center
      text-xs font-semibold text-enb-green shrink-0">
      {initials}
    </div>
  );
}

function AssignModal({
  departments, regions, roles, currentUserId,
  onAssign, onClose,
}: {
  departments: Department[];
  regions: Region[];
  roles: OrgRole[];
  currentUserId: string;
  onAssign: () => void;
  onClose: () => void;
}) {
  const { user: adminUser } = useUserStore();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [deptId, setDeptId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Filter regions by level for display grouping
  const regionGroups = [
    { label: 'Countries',             levels: ['country'] },
    { label: 'Provinces',             levels: ['province'] },
    { label: 'City Groups',           levels: ['city_group'] },
    { label: 'Cities',                levels: ['city'] },
    { label: 'Neighbourhood Groups',  levels: ['neighbourhood_group'] },
    { label: 'Neighbourhoods',        levels: ['neighbourhood'] },
  ];

  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 2) { setUsers([]); return; }
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, role, neighbourhood, profile_pic_url')
        .ilike('full_name', `%${search}%`)
        .limit(15);
      setUsers(data || []);
    };
    const t = setTimeout(searchUsers, 300);
    return () => clearTimeout(t);
  }, [search]);

  const save = async () => {
    if (!selectedUser || !deptId || !regionId) {
      setError('Please select a member, department and region.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('user_org_memberships').upsert({
      user_id: selectedUser.id,
      department_id: deptId,
      region_id: regionId,
      org_role_id: roleId || null,
      assigned_by: adminUser?.id,
      notes: notes.trim() || null,
      is_active: true,
    }, { onConflict: 'user_id,department_id,region_id' });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAssign();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-enb-text-primary">Assign Member</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: Select user */}
          <div>
            <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider mb-2">
              1 — Select Member
            </p>
            {selectedUser ? (
              <div className="flex items-center gap-3 p-3 bg-enb-green/5 rounded-xl border border-enb-green/20">
                <Avatar user={selectedUser} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-enb-text-primary">{selectedUser.full_name}</p>
                  <p className="text-xs text-enb-text-secondary">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)}
                  className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 mb-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search member by name..."
                    className="flex-1 bg-transparent text-sm outline-none text-enb-text-primary"
                  />
                </div>
                {users.length > 0 && (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    {users.map(u => (
                      <button key={u.id} onClick={() => { setSelectedUser(u); setSearch(''); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                        <Avatar user={u} />
                        <div>
                          <p className="text-sm font-medium text-enb-text-primary">{u.full_name}</p>
                          <p className="text-xs text-enb-text-secondary capitalize">{u.role}{u.neighbourhood ? ` · ${u.neighbourhood}` : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Step 2: Department */}
          <div>
            <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider mb-2">
              2 — Department
            </p>
            <select value={deptId} onChange={e => setDeptId(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white
                outline-none focus:border-enb-green text-enb-text-primary">
              <option value="">Select department...</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
              ))}
            </select>
          </div>

          {/* Step 3: Region */}
          <div>
            <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider mb-2">
              3 — Region
            </p>
            <select value={regionId} onChange={e => setRegionId(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white
                outline-none focus:border-enb-green text-enb-text-primary">
              <option value="">Select region...</option>
              {regionGroups.map(group => {
                const groupRegions = regions.filter(r => group.levels.includes(r.level));
                if (groupRegions.length === 0) return null;
                return (
                  <optgroup key={group.label} label={group.label}>
                    {groupRegions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Step 4: Role */}
          <div>
            <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider mb-2">
              4 — Org Role (optional)
            </p>
            <select value={roleId} onChange={e => setRoleId(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white
                outline-none focus:border-enb-green text-enb-text-primary">
              <option value="">Member (no special role)</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider mb-2">
              Notes (optional)
            </p>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Temporary assignment, covering for..."
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200
                outline-none focus:border-enb-green text-enb-text-primary" />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button onClick={save} disabled={saving || !selectedUser || !deptId || !regionId}
            className="w-full py-3 bg-enb-green text-white text-sm font-semibold rounded-xl
              hover:bg-enb-green/90 disabled:opacity-50 transition-colors">
            {saving ? 'Assigning...' : 'Assign Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MembersTab() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const { user } = useUserStore();

  const fetchAll = useCallback(async () => {
    // Fetch memberships first
    const { data: memData, error: memErr } = await supabase
      .from('user_org_memberships')
      .select('*')
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    if (memErr) { console.error('memberships error:', memErr); }

    const mems = memData || [];

    // Fetch supporting data in parallel
    const [usersRes, deptRes, regRes, roleRes] = await Promise.all([
      supabase.from('users').select('id, full_name, email, profile_pic_url'),
      supabase.from('departments').select('id, name, icon').eq('is_active', true).order('name'),
      supabase.from('regions').select('id, name, level').order('name'),
      supabase.from('org_roles').select('id, name').order('name'),
    ]);

    const usersMap   = new Map((usersRes.data   || []).map(u => [u.id, u]));
    const deptsMap   = new Map((deptRes.data    || []).map(d => [d.id, d]));
    const regionsMap = new Map((regRes.data     || []).map(r => [r.id, r]));
    const rolesMap   = new Map((roleRes.data    || []).map(r => [r.id, r]));

    // Manually join
    const joined = mems.map(m => ({
      ...m,
      users:       usersMap.get(m.user_id)       || { full_name: 'Unknown', email: '', profile_pic_url: null },
      departments: deptsMap.get(m.department_id) || { name: 'Unknown', icon: null },
      regions:     regionsMap.get(m.region_id)   || { name: 'Unknown', level: '' },
      org_roles:   m.org_role_id ? rolesMap.get(m.org_role_id) || null : null,
    }));

    setMemberships(joined as any);
    setDepartments(deptRes.data  || []);
    setRegions(regRes.data       || []);
    setRoles(roleRes.data        || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const revoke = async (id: string) => {
    await supabase.from('user_org_memberships').update({ is_active: false }).eq('id', id);
    fetchAll();
  };

  const filtered = memberships.filter(m =>
    (!filterDept   || m.department_id === filterDept) &&
    (!filterRegion || m.region_id     === filterRegion)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-enb-text-primary">Member Assignments</h2>
          <p className="text-xs text-enb-text-secondary mt-0.5">
            Assign members to departments and regions with specific roles
          </p>
        </div>
        <button onClick={() => setShowAssign(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-enb-green text-white text-xs
            font-semibold rounded-xl hover:bg-enb-green/90 transition-colors">
          <Plus className="w-3.5 h-3.5" />Assign Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white
            outline-none text-enb-text-primary">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
        </select>
        <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white
            outline-none text-enb-text-primary">
          <option value="">All Regions</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {(filterDept || filterRegion) && (
          <button onClick={() => { setFilterDept(''); setFilterRegion(''); }}
            className="text-xs px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-enb-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-enb-text-secondary">No assignments yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.map((m, i) => (
            <div key={m.id}
              className={`flex items-center gap-3 px-4 py-3 ${i !== filtered.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <Avatar user={m.users} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-enb-text-primary truncate">{m.users.full_name}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                    {m.departments.icon} {m.departments.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                    📍 {m.regions.name}
                  </span>
                  {m.org_roles && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                      🛡️ {m.org_roles.name}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => revoke(m.id)}
                className="shrink-0 text-[10px] px-2 py-1 rounded-lg bg-red-50 text-red-500
                  hover:bg-red-100 font-medium transition-colors">
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {showAssign && (
        <AssignModal
          departments={departments}
          regions={regions}
          roles={roles}
          currentUserId={user?.id || ''}
          onAssign={() => { setShowAssign(false); fetchAll(); }}
          onClose={() => setShowAssign(false)}
        />
      )}
    </div>
  );
}
