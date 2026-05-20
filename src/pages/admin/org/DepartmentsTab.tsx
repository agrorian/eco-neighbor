// src/pages/admin/org/DepartmentsTab.tsx
// Departments — functional domains of ENB

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Check, X, Building2 } from 'lucide-react';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface Department {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
}

const PRESET_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#f97316', '#16a34a', '#0ea5e9', '#ec4899',
  '#6366f1', '#14b8a6', '#ef4444', '#84cc16',
];

const PRESET_ICONS = ['🍎', '🗳️', '🛡️', '🤝', '🏃', '🌱', '📋', '🔍', '💼', '🏘️', '📣', '⚖️'];

function DeptCard({
  dept,
  onRefresh,
}: {
  dept: Department;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(dept.name);
  const [description, setDescription] = useState(dept.description || '');
  const [icon, setIcon] = useState(dept.icon || '🏢');
  const [color, setColor] = useState(dept.color || '#22c55e');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await getDb().from('departments').update({
      name: name.trim(),
      description: description.trim() || null,
      icon,
      color,
    }).eq('id', dept.id);
    setSaving(false);
    setEditing(false);
    onRefresh();
  };

  const toggleActive = async () => {
    await getDb().from('departments')
      .update({ is_active: !dept.is_active })
      .eq('id', dept.id);
    onRefresh();
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-enb-green/40 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3">
          {/* Icon picker */}
          <div>
            <p className="text-xs text-enb-text-secondary mb-1">Icon</p>
            <div className="flex flex-wrap gap-1 w-40">
              {PRESET_ICONS.map(i => (
                <button key={i} onClick={() => setIcon(i)}
                  className={`w-7 h-7 rounded-lg text-base flex items-center justify-center
                    ${icon === i ? 'bg-enb-green/20 ring-1 ring-enb-green' : 'hover:bg-gray-100'}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          {/* Color picker */}
          <div>
            <p className="text-xs text-enb-text-secondary mb-1">Color</p>
            <div className="flex flex-wrap gap-1 w-32">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform
                    ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Department name"
          className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none
            focus:border-enb-green text-enb-text-primary"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none
            focus:border-enb-green text-enb-text-primary resize-none"
        />
        <div className="flex gap-2">
          <button onClick={save} disabled={saving || !name.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-enb-green text-white text-xs
              font-semibold rounded-lg hover:bg-enb-green/90 disabled:opacity-50">
            <Check className="w-3 h-3" />{saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-xs
              font-semibold rounded-lg hover:bg-gray-200 text-enb-text-secondary">
            <X className="w-3 h-3" />Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition-all
      hover:shadow-md ${!dept.is_active ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Icon with color background */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: (dept.color || '#22c55e') + '20' }}>
          {dept.icon || '🏢'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-enb-text-primary truncate">{dept.name}</h3>
            {!dept.is_active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 font-medium shrink-0">
                Inactive
              </span>
            )}
          </div>
          {dept.description && (
            <p className="text-xs text-enb-text-secondary mt-0.5 line-clamp-2">{dept.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditing(true)}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
            title="Edit">
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button onClick={toggleActive}
            className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-colors
              ${dept.is_active
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}>
            {dept.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewDeptForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { user } = useUserStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏢');
  const [color, setColor] = useState('#22c55e');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    await getDb().from('departments').insert({
      name: name.trim(),
      description: description.trim() || null,
      icon,
      color,
      created_by: user.id,
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="bg-white rounded-xl border border-dashed border-enb-green/40 p-4 space-y-3">
      <p className="text-sm font-semibold text-enb-text-primary">New Department</p>
      <div className="flex items-start gap-4">
        <div>
          <p className="text-xs text-enb-text-secondary mb-1">Icon</p>
          <div className="flex flex-wrap gap-1 w-36">
            {PRESET_ICONS.map(i => (
              <button key={i} onClick={() => setIcon(i)}
                className={`w-7 h-7 rounded-lg text-base flex items-center justify-center
                  ${icon === i ? 'bg-enb-green/20 ring-1 ring-enb-green' : 'hover:bg-gray-100'}`}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-enb-text-secondary mb-1">Color</p>
          <div className="flex flex-wrap gap-1 w-32">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full transition-transform
                  ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
              />
            ))}
          </div>
        </div>
      </div>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Department name"
        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none
          focus:border-enb-green text-enb-text-primary"
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="What does this department do? (optional)"
        rows={2}
        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none
          focus:border-enb-green text-enb-text-primary resize-none"
      />
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-enb-green text-white text-xs
            font-semibold rounded-lg hover:bg-enb-green/90 disabled:opacity-50">
          <Check className="w-3 h-3" />{saving ? 'Saving...' : 'Create Department'}
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

export default function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const fetchDepts = useCallback(async () => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    setDepartments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  const active = departments.filter(d => d.is_active);
  const inactive = departments.filter(d => !d.is_active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-enb-text-primary">Departments</h2>
          <p className="text-xs text-enb-text-secondary mt-0.5">
            Functional domains — each member can belong to one or more departments
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-enb-green text-white text-xs
            font-semibold rounded-xl hover:bg-enb-green/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Department
        </button>
      </div>

      {showNew && (
        <NewDeptForm
          onSave={() => { setShowNew(false); fetchDepts(); }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-enb-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {active.map(d => <DeptCard key={d.id} dept={d} onRefresh={fetchDepts} />)}
          </div>
          {inactive.length > 0 && (
            <div>
              <p className="text-xs font-medium text-enb-text-secondary mb-2 px-1">Inactive</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inactive.map(d => <DeptCard key={d.id} dept={d} onRefresh={fetchDepts} />)}
              </div>
            </div>
          )}
          {departments.length === 0 && (
            <div className="text-center py-10">
              <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-enb-text-secondary">No departments yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
