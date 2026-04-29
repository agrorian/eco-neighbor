// src/pages/channels/CreateChannelModal.tsx
// Create and configure a new channel

import { useState, useEffect } from 'react';
import { X, Hash, Megaphone, Lock, Check, Search, Minus, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface Department { id: string; name: string; icon: string | null; }
interface Region     { id: string; name: string; level: string; parent_id: string | null; }
interface UserProfile { id: string; full_name: string; role: string; }

interface CreateChannelModalProps {
  onCreated: () => void;
  onClose: () => void;
}

const POSTING_MODES = [
  {
    value: 'open',
    label: 'Open',
    description: 'Anyone in the channel can post',
    icon: Hash,
    color: 'text-enb-green',
    bg: 'bg-enb-green/10',
  },
  {
    value: 'moderated',
    label: 'Moderated',
    description: 'Anyone posts but admin approves first',
    icon: Lock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    value: 'admin_only',
    label: 'Announcement',
    description: 'Only channel admin can post',
    icon: Megaphone,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
];

export default function CreateChannelModal({ onCreated, onClose }: CreateChannelModalProps) {
  const { user } = useUserStore();
  const [step, setStep] = useState(1); // 1=basic, 2=scope, 3=members

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [postingMode, setPostingMode] = useState('open');

  // Scope
  const [departments, setDepartments] = useState<Department[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [excludedRegionIds, setExcludedRegionIds] = useState<string[]>([]);

  // Members
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserProfile[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      const [deptsRes, regionsRes] = await Promise.all([
        supabase.from('departments').select('id, name, icon').eq('is_active', true).order('name'),
        supabase.from('regions').select('id, name, level, parent_id').order('name'),
      ]);
      setDepartments(deptsRes.data || []);
      setRegions(regionsRes.data || []);
    };
    fetchOptions();
  }, []);

  // Search members
  useEffect(() => {
    if (memberSearch.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, role')
        .ilike('full_name', `%${memberSearch}%`)
        .limit(10);
      setSearchResults((data || []).filter(u =>
        !selectedMembers.some(m => m.id === u.id)
      ));
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch, selectedMembers]);

  // Auto-name channel from dept + region selection
  useEffect(() => {
    const dept   = departments.find(d => d.id === selectedDeptId);
    const region = regions.find(r => r.id === selectedRegionId);
    if (dept && region) setName(`${dept.name} — ${region.name}`);
    else if (dept)      setName(dept.name);
    else if (region)    setName(region.name);
  }, [selectedDeptId, selectedRegionId, departments, regions]);

  const toggleExcludeRegion = (id: string) => {
    setExcludedRegionIds(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const addMember = (u: UserProfile) => {
    setSelectedMembers(prev => [...prev, u]);
    setMemberSearch('');
    setSearchResults([]);
  };

  const removeMember = (id: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== id));
  };

  // Child regions of selected region (for exclusion)
  const childRegions = regions.filter(r => r.parent_id === selectedRegionId);

  const save = async () => {
    if (!name.trim()) { setError('Channel name is required.'); return; }
    if (!user) return;
    setSaving(true);
    setError('');

    // 1. Create channel
    const { data: channel, error: chanErr } = await supabase
      .from('channels')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        type: 'custom',
        posting_mode: postingMode,
        dept_id: selectedDeptId || null,
        region_id: selectedRegionId || null,
        excluded_region_ids: excludedRegionIds,
        created_by: user.id,
        auto_generated: false,
      })
      .select()
      .single();

    if (chanErr || !channel) {
      setError(chanErr?.message || 'Failed to create channel.');
      setSaving(false);
      return;
    }

    // 2. Add creator as admin
    await supabase.from('channel_members').insert({
      channel_id: channel.id,
      user_id: user.id,
      role: 'admin',
    });

    // 3. Add selected members
    if (selectedMembers.length > 0) {
      await supabase.from('channel_members').insert(
        selectedMembers.map(m => ({
          channel_id: channel.id,
          user_id: m.id,
          role: 'member',
        }))
      );
    }

    setSaving(false);
    onCreated();
  };

  const canProceed = step === 1 ? name.trim().length > 0 : true;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-semibold text-enb-text-primary">Create Channel</h3>
            <p className="text-xs text-enb-text-secondary">Step {step} of 3</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 shrink-0">
          <div
            className="h-full bg-enb-green transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── Step 1: Basic info ── */}
          {step === 1 && (
            <>
              <div>
                <label className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider">
                  Channel Name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. CFSP — Lahore"
                  className="w-full mt-1.5 text-sm px-3 py-2.5 rounded-xl border border-gray-200
                    outline-none focus:border-enb-green text-enb-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What is this channel for?"
                  rows={2}
                  className="w-full mt-1.5 text-sm px-3 py-2.5 rounded-xl border border-gray-200
                    outline-none focus:border-enb-green text-enb-text-primary resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider mb-2 block">
                  Posting Mode
                </label>
                <div className="space-y-2">
                  {POSTING_MODES.map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => setPostingMode(mode.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                        ${postingMode === mode.value
                          ? 'border-enb-green bg-enb-green/5'
                          : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${mode.bg}`}>
                        <mode.icon className={`w-4 h-4 ${mode.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-enb-text-primary">{mode.label}</p>
                        <p className="text-xs text-enb-text-secondary">{mode.description}</p>
                      </div>
                      {postingMode === mode.value && (
                        <Check className="w-4 h-4 text-enb-green shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Scope (dept + region + exclusions) ── */}
          {step === 2 && (
            <>
              <div>
                <label className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider">
                  Department (optional)
                </label>
                <select
                  value={selectedDeptId}
                  onChange={e => setSelectedDeptId(e.target.value)}
                  className="w-full mt-1.5 text-sm px-3 py-2.5 rounded-xl border border-gray-200
                    bg-white outline-none focus:border-enb-green text-enb-text-primary"
                >
                  <option value="">No department scope</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider">
                  Region (optional)
                </label>
                <select
                  value={selectedRegionId}
                  onChange={e => { setSelectedRegionId(e.target.value); setExcludedRegionIds([]); }}
                  className="w-full mt-1.5 text-sm px-3 py-2.5 rounded-xl border border-gray-200
                    bg-white outline-none focus:border-enb-green text-enb-text-primary"
                >
                  <option value="">No region scope</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.level})</option>
                  ))}
                </select>
              </div>

              {/* Exclusions — only show if a region is selected and has children */}
              {selectedRegionId && childRegions.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider mb-2 block">
                    Exclude Sub-regions (optional)
                  </label>
                  <p className="text-xs text-enb-text-secondary mb-2">
                    Toggle off any sub-regions that should NOT receive this channel's messages.
                  </p>
                  <div className="space-y-1.5">
                    {childRegions.map(r => (
                      <button
                        key={r.id}
                        onClick={() => toggleExcludeRegion(r.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl
                          border text-sm transition-colors
                          ${excludedRegionIds.includes(r.id)
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : 'border-gray-100 bg-white text-enb-text-primary hover:border-gray-200'
                          }`}
                      >
                        <span>{r.name}</span>
                        {excludedRegionIds.includes(r.id)
                          ? <Minus className="w-3.5 h-3.5 text-red-500" />
                          : <Check className="w-3.5 h-3.5 text-enb-green" />
                        }
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Step 3: Add members ── */}
          {step === 3 && (
            <>
              <div>
                <label className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider mb-2 block">
                  Add Members (optional)
                </label>
                <p className="text-xs text-enb-text-secondary mb-3">
                  You'll be added as admin automatically. Search to add more members.
                </p>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 mb-2">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    autoFocus
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Search members by name..."
                    className="flex-1 bg-transparent text-sm outline-none text-enb-text-primary"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
                    {searchResults.map(u => (
                      <button key={u.id} onClick={() => addMember(u)}
                        className="w-full flex items-center justify-between px-3 py-2.5
                          hover:bg-gray-50 border-b border-gray-50 last:border-0 text-left">
                        <div>
                          <p className="text-sm font-medium text-enb-text-primary">{u.full_name}</p>
                          <p className="text-xs text-enb-text-secondary capitalize">{u.role}</p>
                        </div>
                        <Plus className="w-4 h-4 text-enb-green" />
                      </button>
                    ))}
                  </div>
                )}

                {selectedMembers.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-enb-text-secondary">
                      Added ({selectedMembers.length})
                    </p>
                    {selectedMembers.map(m => (
                      <div key={m.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl
                          bg-enb-green/5 border border-enb-green/20">
                        <p className="text-sm font-medium text-enb-text-primary">{m.full_name}</p>
                        <button onClick={() => removeMember(m.id)}>
                          <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-100 shrink-0">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl
                hover:bg-gray-50 text-enb-text-secondary">
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed}
              className="flex-1 py-2.5 text-sm font-semibold bg-enb-green text-white rounded-xl
                hover:bg-enb-green/90 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold bg-enb-green text-white rounded-xl
                hover:bg-enb-green/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating...' : 'Create Channel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
