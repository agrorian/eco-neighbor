// src/pages/channels/GenerateChannelsModal.tsx
// SA one-click: generate channels from org structure
// Only creates channels where dept head + region head both exist

import { useState, useEffect } from 'react';
import { X, Zap, Check, AlertCircle, Hash } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface PreviewChannel {
  name: string;
  dept_id: string;
  dept_name: string;
  dept_icon: string | null;
  region_id: string;
  region_name: string;
  admin_id: string;
  admin_name: string;
  already_exists: boolean;
}

export default function GenerateChannelsModal({
  onGenerated,
  onClose,
}: {
  onGenerated: () => void;
  onClose: () => void;
}) {
  const { user } = useUserStore();
  const [preview, setPreview] = useState<PreviewChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    generatePreview();
  }, []);

  const generatePreview = async () => {
    setLoading(true);

    // 1. Get all active memberships where user has Dept Admin or Regional Head role
    const { data: adminMemberships } = await supabase
      .from('user_org_memberships')
      .select(`
        user_id, department_id, region_id,
        org_roles(name, permissions)
      `)
      .eq('is_active', true);

    if (!adminMemberships) { setLoading(false); return; }

    // Filter to only those with can_post_announcements (dept/region admins)
    const admins = adminMemberships.filter(m =>
      (m.org_roles as any)?.permissions?.can_post_announcements === true
    );

    // 2. Get dept and region details
    const deptIds   = [...new Set(admins.map(a => a.department_id).filter(Boolean))];
    const regionIds = [...new Set(admins.map(a => a.region_id).filter(Boolean))];
    const userIds   = [...new Set(admins.map(a => a.user_id))];

    const [deptsRes, regionsRes, usersRes, existingRes] = await Promise.all([
      supabase.from('departments').select('id, name, icon').in('id', deptIds),
      supabase.from('regions').select('id, name').in('id', regionIds),
      supabase.from('users').select('id, full_name').in('id', userIds),
      supabase.from('channels').select('dept_id, region_id').eq('auto_generated', true),
    ]);

    const deptsMap   = new Map((deptsRes.data   || []).map(d => [d.id, d]));
    const regionsMap = new Map((regionsRes.data  || []).map(r => [r.id, r]));
    const usersMap   = new Map((usersRes.data    || []).map(u => [u.id, u]));
    const existingSet = new Set(
      (existingRes.data || []).map(c => `${c.dept_id}__${c.region_id}`)
    );

    // 3. Build preview — one channel per unique dept+region pair that has an admin
    const seen = new Set<string>();
    const channels: PreviewChannel[] = [];

    admins.forEach(a => {
      if (!a.department_id || !a.region_id) return;
      const key = `${a.department_id}__${a.region_id}`;
      if (seen.has(key)) return;
      seen.add(key);

      const dept   = deptsMap.get(a.department_id);
      const region = regionsMap.get(a.region_id);
      const admin  = usersMap.get(a.user_id);
      if (!dept || !region || !admin) return;

      channels.push({
        name:           `${dept.name} — ${region.name}`,
        dept_id:        a.department_id,
        dept_name:      dept.name,
        dept_icon:      dept.icon,
        region_id:      a.region_id,
        region_name:    region.name,
        admin_id:       a.user_id,
        admin_name:     admin.full_name,
        already_exists: existingSet.has(key),
      });
    });

    setPreview(channels);
    // Pre-select all that don't exist yet
    setSelected(new Set(
      channels.filter(c => !c.already_exists).map(c => `${c.dept_id}__${c.region_id}`)
    ));
    setLoading(false);
  };

  const toggleChannel = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const generate = async () => {
    if (!user || selected.size === 0) return;
    setGenerating(true);

    const toCreate = preview.filter(c =>
      selected.has(`${c.dept_id}__${c.region_id}`) && !c.already_exists
    );

    for (const ch of toCreate) {
      // Create channel
      const { data: channel } = await supabase
        .from('channels')
        .insert({
          name:          ch.name,
          type:          'custom',
          posting_mode:  'open',
          dept_id:       ch.dept_id,
          region_id:     ch.region_id,
          created_by:    user.id,
          auto_generated: true,
        })
        .select()
        .single();

      if (!channel) continue;

      // Add dept admin as channel admin
      await supabase.from('channel_members').insert({
        channel_id: channel.id,
        user_id:    ch.admin_id,
        role:       'admin',
      });

      // Auto-add all org members from that dept+region
      const { data: members } = await supabase
        .from('user_org_memberships')
        .select('user_id')
        .eq('department_id', ch.dept_id)
        .eq('region_id', ch.region_id)
        .eq('is_active', true)
        .neq('user_id', ch.admin_id);

      if (members?.length) {
        await supabase.from('channel_members').insert(
          members.map(m => ({
            channel_id: channel.id,
            user_id:    m.user_id,
            role:       'member',
          }))
        );
      }
    }

    setGenerating(false);
    setDone(true);
    setTimeout(() => { onGenerated(); }, 1500);
  };

  const newCount = preview.filter(c =>
    selected.has(`${c.dept_id}__${c.region_id}`) && !c.already_exists
  ).length;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-enb-text-primary">Generate Channels</h3>
              <p className="text-xs text-enb-text-secondary">From org structure</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {done ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-enb-green/10 flex items-center justify-center mb-3">
                <Check className="w-7 h-7 text-enb-green" />
              </div>
              <p className="font-semibold text-enb-text-primary">Channels created!</p>
              <p className="text-sm text-enb-text-secondary mt-1">Members have been auto-added.</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-enb-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : preview.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="font-semibold text-enb-text-primary">No channels to generate</p>
              <p className="text-sm text-enb-text-secondary mt-1 max-w-xs mx-auto">
                Channels are only created where both a Department Admin and Regional Head are assigned in Org Structure.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-enb-text-secondary mb-3">
                Select which channels to create. Only dept+region pairs with an assigned admin are shown.
              </p>
              <div className="space-y-2">
                {preview.map(ch => {
                  const key = `${ch.dept_id}__${ch.region_id}`;
                  const isSelected = selected.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => !ch.already_exists && toggleChannel(key)}
                      disabled={ch.already_exists}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                        ${ch.already_exists
                          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          : isSelected
                            ? 'border-enb-green bg-enb-green/5'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <Hash className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-enb-text-primary truncate">{ch.name}</p>
                        <p className="text-xs text-enb-text-secondary">
                          Admin: {ch.admin_name}
                          {ch.already_exists && ' · Already exists'}
                        </p>
                      </div>
                      {ch.already_exists
                        ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 shrink-0">Exists</span>
                        : isSelected
                          ? <Check className="w-4 h-4 text-enb-green shrink-0" />
                          : <div className="w-4 h-4 rounded border border-gray-300 shrink-0" />
                      }
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {!done && !loading && preview.length > 0 && (
          <div className="p-4 border-t border-gray-100 shrink-0">
            <button
              onClick={generate}
              disabled={generating || newCount === 0}
              className="w-full py-3 bg-enb-green text-white text-sm font-semibold rounded-xl
                hover:bg-enb-green/90 disabled:opacity-50 transition-colors"
            >
              {generating ? 'Generating...' : `Create ${newCount} Channel${newCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
