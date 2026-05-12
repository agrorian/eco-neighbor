// src/pages/channels/ChannelInfoPanel.tsx
// Slide-in channel info panel — members, settings, permissions

import { useState, useEffect, useCallback } from 'react';
import { X, Hash, Megaphone, Lock, Users, Search, Plus,
  Pencil, Check, Shield, Trash2, LogOut, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore, isSuperAdmin as checkSuperAdmin } from '@/store/user';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Channel {
  id: string;
  name: string;
  description: string | null;
  posting_mode: string;
  type: string;
  created_by: string;
  dept_id: string | null;
  region_id: string | null;
}

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string;
  profile_pic_url: string | null;
  user_role: string;
}

interface SearchUser {
  id: string;
  full_name: string;
  role: string;
  neighbourhood: string | null;
  profile_pic_url: string | null;
}

const CHANNEL_ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Can manage members, settings and post in any mode',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    badgeColor: 'bg-amber-50 text-amber-600',
  },
  {
    value: 'moderator',
    label: 'Moderator',
    description: 'Can moderate content and manage members',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badgeColor: 'bg-blue-50 text-blue-600',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'Standard channel member',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    badgeColor: 'bg-gray-100 text-gray-500',
  },
] as const;

function getRoleMeta(role: string, userRole?: string) {
  if (userRole === 'admin') return {
    label: 'Super Admin',
    badgeColor: 'bg-enb-green/10 text-enb-green',
    icon: true,
  };
  const found = CHANNEL_ROLES.find(r => r.value === role);
  return {
    label: found?.label || 'Member',
    badgeColor: found?.badgeColor || 'bg-gray-100 text-gray-500',
    icon: role === 'admin',
  };
}

const POSTING_MODES = [
  { value: 'open',       label: 'Open',         description: 'Anyone can post',              icon: Hash,     color: 'text-enb-green' },
  { value: 'moderated',  label: 'Moderated',    description: 'Admin approves posts',         icon: Lock,     color: 'text-amber-600' },
  { value: 'admin_only', label: 'Announcement', description: 'Only admin can post',          icon: Megaphone,color: 'text-blue-600'  },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, url }: { name: string; url?: string | null }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return url ? (
    <img src={url} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-9 h-9 rounded-full bg-enb-green/20 flex items-center justify-center
      text-sm font-semibold text-enb-green shrink-0">
      {initials}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ChannelInfoPanelProps {
  channel: Channel;
  onClose: () => void;
  onChannelUpdated: (updated: Partial<Channel>) => void;
  onChannelDeleted: () => void;
}

export default function ChannelInfoPanel({
  channel, onClose, onChannelUpdated, onChannelDeleted,
}: ChannelInfoPanelProps) {
  const { user } = useUserStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string | null>(null);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameVal, setNameVal] = useState(channel.name);
  const [descVal, setDescVal] = useState(channel.description || '');
  const [modeVal, setModeVal] = useState(channel.posting_mode);

  // Add member
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [addingMember, setAddingMember] = useState(false);

  // ── ENB DOCTRINE: Always use shared isSuperAdmin() from store ────────────
  const isSuperAdmin = checkSuperAdmin(user?.role);

  // ── Fetch members ──────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data: memberData } = await supabase
      .from('channel_members')
      .select('user_id, role, joined_at')
      .eq('channel_id', channel.id)
      .order('role');

    if (!memberData?.length) { setLoading(false); return; }

    const userIds = memberData.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('users')
      .select('id, full_name, profile_pic_url, role')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const joined: Member[] = memberData.map(m => ({
      user_id:         m.user_id,
      role:            m.role,
      joined_at:       m.joined_at,
      full_name:       profileMap.get(m.user_id)?.full_name || 'Unknown',
      profile_pic_url: profileMap.get(m.user_id)?.profile_pic_url || null,
      user_role:       profileMap.get(m.user_id)?.role || 'member',
    }));

    setMembers(joined);
    const me = joined.find(m => m.user_id === user?.id);
    setMyRole(me?.role || null);
    setLoading(false);
  }, [channel.id, user?.id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // ── Search users to add ────────────────────────────────────────────────────
  useEffect(() => {
    if (memberSearch.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const existingIds = members.map(m => m.user_id);
      const { data } = await supabase
        .from('users')
        .select('id, full_name, role, neighbourhood, profile_pic_url')
        .ilike('full_name', `%${memberSearch}%`)
        .limit(10);
      setSearchResults((data || []).filter(u => !existingIds.includes(u.id)));
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch, members]);

  const canManage = isSuperAdmin || myRole === 'admin' || myRole === 'moderator';
  const canManageFully = isSuperAdmin || myRole === 'admin'; // settings, delete, promote to admin

  // ── Save name ──────────────────────────────────────────────────────────────
  const saveName = async () => {
    if (!nameVal.trim()) return;
    await supabase.from('channels').update({ name: nameVal.trim() }).eq('id', channel.id);
    setEditingName(false);
    onChannelUpdated({ name: nameVal.trim() });
  };

  // ── Save description ───────────────────────────────────────────────────────
  const saveDesc = async () => {
    await supabase.from('channels').update({ description: descVal.trim() || null }).eq('id', channel.id);
    setEditingDesc(false);
    onChannelUpdated({ description: descVal.trim() || null });
  };

  // ── Save posting mode ──────────────────────────────────────────────────────
  const saveMode = async (mode: string) => {
    await supabase.from('channels').update({ posting_mode: mode }).eq('id', channel.id);
    setModeVal(mode);
    setEditingMode(false);
    onChannelUpdated({ posting_mode: mode });
  };

  // ── Add member ─────────────────────────────────────────────────────────────
  const addMember = async (u: SearchUser) => {
    setAddingMember(true);
    const role = u.role === 'admin' ? 'admin' : 'member';
    await supabase.from('channel_members').insert({
      channel_id: channel.id,
      user_id:    u.id,
      role,
    });
    setMemberSearch('');
    setSearchResults([]);
    setAddingMember(false);
    fetchMembers();
  };

  // ── Change member role ─────────────────────────────────────────────────────
  const changeMemberRole = async (userId: string, newRole: string) => {
    await supabase.from('channel_members')
      .update({ role: newRole })
      .eq('channel_id', channel.id)
      .eq('user_id', userId);
    fetchMembers();
  };

  // ── Remove member ──────────────────────────────────────────────────────────
  const removeMember = async (userId: string) => {
    await supabase.from('channel_members')
      .delete()
      .eq('channel_id', channel.id)
      .eq('user_id', userId);
    fetchMembers();
  };

  // ── Leave channel ──────────────────────────────────────────────────────────
  const leaveChannel = async () => {
    if (!user) return;
    await supabase.from('channel_members')
      .delete()
      .eq('channel_id', channel.id)
      .eq('user_id', user.id);
    onChannelDeleted();
  };

  // ── Delete channel ─────────────────────────────────────────────────────────
  const deleteChannel = async () => {
    if (!canManageFully) return;
    if (!confirm('Delete this channel? This cannot be undone.')) return;
    await supabase.from('channels').delete().eq('id', channel.id);
    onChannelDeleted();
  };

  const currentMode = POSTING_MODES.find(m => m.value === modeVal) || POSTING_MODES[0];

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100 w-full md:w-80 shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
        <h3 className="font-semibold text-enb-text-primary">Channel Info</h3>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Channel name */}
        <div className="px-4 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <currentMode.icon className={`w-6 h-6 ${currentMode.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={nameVal}
                    onChange={e => setNameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                    className="flex-1 text-sm font-semibold px-2 py-1 rounded-lg border border-enb-green outline-none"
                  />
                  <button onClick={saveName} className="w-6 h-6 rounded-md bg-enb-green flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-enb-text-primary truncate">{nameVal}</p>
                  {canManageFully && (
                    <button onClick={() => setEditingName(true)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100">
                      <Pencil className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-enb-text-secondary">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-2">
            {editingDesc ? (
              <div className="space-y-1.5">
                <textarea
                  autoFocus
                  value={descVal}
                  onChange={e => setDescVal(e.target.value)}
                  rows={2}
                  placeholder="Channel description..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-enb-green outline-none resize-none text-enb-text-primary"
                />
                <div className="flex gap-1.5">
                  <button onClick={saveDesc} className="px-3 py-1 bg-enb-green text-white text-xs rounded-lg font-medium">Save</button>
                  <button onClick={() => setEditingDesc(false)} className="px-3 py-1 bg-gray-100 text-xs rounded-lg text-enb-text-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-1 group">
                <p className="text-xs text-enb-text-secondary flex-1">
                  {descVal || (canManageFully ? 'Add a description...' : 'No description')}
                </p>
                {canManageFully && (
                  <button onClick={() => setEditingDesc(true)}
                    className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100 shrink-0">
                    <Pencil className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Posting mode */}
        <div className="px-4 py-3 border-b border-gray-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider">Posting Mode</p>
            {canManageFully && (
              <button onClick={() => setEditingMode(m => !m)}
                className="flex items-center gap-1 text-xs text-enb-green font-medium">
                Change <ChevronDown className={`w-3 h-3 transition-transform ${editingMode ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {editingMode ? (
            <div className="space-y-1.5">
              {POSTING_MODES.map(mode => (
                <button key={mode.value} onClick={() => saveMode(mode.value)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all
                    ${modeVal === mode.value ? 'border-enb-green bg-enb-green/5' : 'border-gray-100 hover:border-gray-200'}`}>
                  <mode.icon className={`w-4 h-4 ${mode.color} shrink-0`} />
                  <div>
                    <p className="text-xs font-semibold text-enb-text-primary">{mode.label}</p>
                    <p className="text-[10px] text-enb-text-secondary">{mode.description}</p>
                  </div>
                  {modeVal === mode.value && <Check className="w-3.5 h-3.5 text-enb-green ml-auto" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50">
              <currentMode.icon className={`w-4 h-4 ${currentMode.color} shrink-0`} />
              <div>
                <p className="text-xs font-semibold text-enb-text-primary">{currentMode.label}</p>
                <p className="text-[10px] text-enb-text-secondary">{currentMode.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Members */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider">
              Members ({members.length})
            </p>
            {canManage && (
              <button onClick={() => setShowAddMember(s => !s)}
                className="flex items-center gap-1 text-xs text-enb-green font-medium">
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>

          {/* Add member search */}
          {showAddMember && (
            <div className="mb-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-1.5">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  autoFocus
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search members..."
                  className="flex-1 bg-transparent text-xs outline-none text-enb-text-primary placeholder:text-gray-400"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {searchResults.map(u => (
                    <button key={u.id} onClick={() => addMember(u)}
                      disabled={addingMember}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50
                        border-b border-gray-50 last:border-0 text-left">
                      <Avatar name={u.full_name} url={u.profile_pic_url} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-enb-text-primary truncate">{u.full_name}</p>
                        <p className="text-[10px] text-enb-text-secondary capitalize">{u.role}</p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-enb-green shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {memberSearch.length >= 2 && searchResults.length === 0 && (
                <p className="text-xs text-enb-text-secondary text-center py-2">No members found.</p>
              )}
            </div>
          )}

          {/* Member list */}
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-enb-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {members.map(m => (
                <div key={m.user_id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 group">
                  <Avatar name={m.full_name} url={m.profile_pic_url} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-enb-text-primary truncate">{m.full_name}</p>
                      {m.user_id === user?.id && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-enb-green/10 text-enb-green font-medium shrink-0">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {(() => {
                        const meta = getRoleMeta(m.role, m.user_role);
                        return (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${meta.badgeColor}`}>
                            {meta.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Actions — only for admins/mods, not on yourself, not on other SAs */}
                  {canManage && m.user_id !== user?.id && m.user_role !== 'admin' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Role change — only canManageFully can promote to admin */}
                      {canManageFully && (
                        <select
                          value={m.role}
                          onChange={e => changeMemberRole(m.user_id, e.target.value)}
                          className="text-[10px] px-1.5 py-1 rounded-lg border border-gray-200
                            bg-white outline-none text-enb-text-secondary cursor-pointer
                            hover:border-enb-green/40 transition-colors"
                        >
                          {CHANNEL_ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      )}
                      {/* Moderators can only remove members, not change roles */}
                      {!canManageFully && canManage && m.role === 'member' && (
                        <span className="text-[10px] text-enb-text-secondary px-1">Member</span>
                      )}
                      <button
                        onClick={() => removeMember(m.user_id)}
                        title="Remove from channel"
                        className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center">
                        <X className="w-3 h-3 text-gray-300 hover:text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-2 shrink-0">
        {myRole && myRole !== 'admin' && !isSuperAdmin && (
          <button onClick={leaveChannel}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
              border border-orange-200 text-orange-600 text-sm font-medium hover:bg-orange-50 transition-colors">
            <LogOut className="w-4 h-4" />
            Leave Channel
          </button>
        )}
        {canManageFully && (
          <button onClick={deleteChannel}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
              border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete Channel
          </button>
        )}
      </div>
    </div>
  );
}
