// src/pages/admin/org/RolesTab.tsx
// Org Roles — define roles and their permission sets

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Check, X, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface OrgRole {
  id: string;
  name: string;
  department_id: string | null;
  permissions: Record<string, boolean>;
  is_active: boolean;
}

interface Department {
  id: string;
  name: string;
  icon: string | null;
}

const PERMISSION_META: Record<string, { label: string; description: string; group: string }> = {
  can_post_announcements: { label: 'Post Announcements',  description: 'Broadcast messages to channel/dept members', group: 'Communication' },
  can_add_members:        { label: 'Add Members',         description: 'Invite users to department or channel',       group: 'Communication' },
  can_remove_members:     { label: 'Remove Members',      description: 'Remove users from department or channel',     group: 'Communication' },
  can_create_channels:    { label: 'Create Channels',     description: 'Create new group channels',                   group: 'Communication' },
  can_assign_roles:       { label: 'Assign Roles',        description: 'Assign org roles to members',                 group: 'Management' },
  can_view_reports:       { label: 'View Reports',        description: 'Access analytics and activity reports',       group: 'Management' },
  can_moderate_content:   { label: 'Moderate Content',    description: 'Review and action flagged content',           group: 'Moderation' },
  can_audit:              { label: 'Audit',               description: 'Read-only access to all dept activity',       group: 'Moderation' },
  can_investigate:        { label: 'Investigate',         description: 'Deep-dive access for investigations',         group: 'Moderation' },
};

const PERMISSION_GROUPS = ['Communication', 'Management', 'Moderation'];

function PermissionToggle({
  permKey,
  value,
  onChange,
}: {
  permKey: string;
  value: boolean;
  onChange: (key: string, val: boolean) => void;
}) {
  const meta = PERMISSION_META[permKey];
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-enb-text-primary">{meta.label}</p>
        <p className="text-xs text-enb-text-secondary">{meta.description}</p>
      </div>
      <button
        onClick={() => onChange(permKey, !value)}
        className={`relative w-10 h-5 rounded-full transition-colors shrink-0
          ${value ? 'bg-enb-green' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm
          transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function RoleCard({ role, departments, onRefresh }: {
  role: OrgRole;
  departments: Department[];
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(role.name);
  const [deptId, setDeptId] = useState(role.department_id || '');
  const [permissions, setPermissions] = useState({ ...role.permissions });
  const [saving, setSaving] = useState(false);

  const activePerms = Object.entries(permissions).filter(([, v]) => v).length;
  const dept = departments.find(d => d.id === role.department_id);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from('org_roles').update({
      name: name.trim(),
      department_id: deptId || null,
      permissions,
    }).eq('id', role.id);
    setSaving(false);
    setEditing(false);
    onRefresh();
  };

  const togglePerm = (key: string, val: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm font-semibold px-2 py-1 rounded-lg border border-enb-green
                outline-none text-enb-text-primary"
            />
          ) : (
            <p className="text-sm font-semibold text-enb-text-primary">{role.name}</p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {editing ? (
              <select
                value={deptId}
                onChange={e => setDeptId(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white
                  outline-none text-enb-text-secondary"
              >
                <option value="">Cross-department (global)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-enb-text-secondary">
                {dept ? `${dept.icon || ''} ${dept.name}` : 'Cross-department'}
              </span>
            )}
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
              {activePerms} permission{activePerms !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <>
              <button onClick={save} disabled={saving}
                className="w-7 h-7 rounded-lg bg-enb-green flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </button>
              <button onClick={() => { setEditing(false); setPermissions({ ...role.permissions }); }}
                className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </>
          ) : (
            <button onClick={() => { setEditing(true); setExpanded(true); }}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          <button onClick={() => setExpanded(e => !e)}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            }
          </button>
        </div>
      </div>

      {/* Permissions */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-3">
          {PERMISSION_GROUPS.map(group => {
            const groupPerms = Object.entries(PERMISSION_META)
              .filter(([, m]) => m.group === group)
              .map(([key]) => key);
            return (
              <div key={group} className="mt-3">
                <p className="text-[11px] font-bold text-enb-text-secondary uppercase tracking-wider mb-1">
                  {group}
                </p>
                {groupPerms.map(key => (
                  <PermissionToggle
                    key={key}
                    permKey={key}
                    value={editing ? permissions[key] : role.permissions[key]}
                    onChange={editing ? togglePerm : () => {}}
                  />
                ))}
              </div>
            );
          })}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="mt-3 w-full py-2 text-xs font-semibold text-enb-green
                bg-enb-green/5 rounded-lg hover:bg-enb-green/10 transition-colors"
            >
              Edit Permissions
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NewRoleForm({ departments, onSave, onCancel }: {
  departments: Department[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const { user } = useUserStore();
  const [name, setName] = useState('');
  const [deptId, setDeptId] = useState('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(PERMISSION_META).map(k => [k, false]))
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from('org_roles').insert({
      name: name.trim(),
      department_id: deptId || null,
      permissions,
      created_by: user?.id,
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="bg-white rounded-xl border border-dashed border-enb-green/40 p-4 space-y-3">
      <p className="text-sm font-semibold text-enb-text-primary">New Role</p>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Role name (e.g. Regional Head, Food Coordinator)"
        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none
          focus:border-enb-green text-enb-text-primary"
      />
      <select
        value={deptId}
        onChange={e => setDeptId(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white
          outline-none focus:border-enb-green text-enb-text-primary"
      >
        <option value="">Cross-department (applies to all)</option>
        {departments.map(d => (
          <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
        ))}
      </select>

      <div className="border border-gray-100 rounded-xl p-3 space-y-1">
        <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider mb-2">
          Permissions
        </p>
        {PERMISSION_GROUPS.map(group => (
          <div key={group} className="mb-2">
            <p className="text-[10px] font-semibold text-enb-text-secondary uppercase mb-1">{group}</p>
            {Object.entries(PERMISSION_META)
              .filter(([, m]) => m.group === group)
              .map(([key]) => (
                <PermissionToggle
                  key={key}
                  permKey={key}
                  value={permissions[key]}
                  onChange={(k, v) => setPermissions(prev => ({ ...prev, [k]: v }))}
                />
              ))
            }
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-enb-green text-white text-xs
            font-semibold rounded-lg hover:bg-enb-green/90 disabled:opacity-50">
          <Check className="w-3 h-3" />{saving ? 'Saving...' : 'Create Role'}
        </button>
        <button onClick={onCancel}
          className="px-3 py-2 bg-gray-100 text-xs font-semibold rounded-lg
            hover:bg-gray-200 text-enb-text-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function RolesTab() {
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const fetchAll = useCallback(async () => {
    const [rolesRes, deptsRes] = await Promise.all([
      supabase.from('org_roles').select('*').order('name'),
      supabase.from('departments').select('id, name, icon').eq('is_active', true).order('name'),
    ]);
    setRoles(rolesRes.data || []);
    setDepartments(deptsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-enb-text-primary">Org Roles</h2>
          <p className="text-xs text-enb-text-secondary mt-0.5">
            Define what each role can do — permissions cascade to channel and messaging rights
          </p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-enb-green text-white text-xs
            font-semibold rounded-xl hover:bg-enb-green/90 transition-colors">
          <Plus className="w-3.5 h-3.5" />New Role
        </button>
      </div>

      {showNew && (
        <NewRoleForm
          departments={departments}
          onSave={() => { setShowNew(false); fetchAll(); }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-enb-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map(r => (
            <RoleCard key={r.id} role={r} departments={departments} onRefresh={fetchAll} />
          ))}
          {roles.length === 0 && (
            <div className="col-span-2 text-center py-10">
              <Shield className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-enb-text-secondary">No roles yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
