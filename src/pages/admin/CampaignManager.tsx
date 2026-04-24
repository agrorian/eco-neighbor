import { useEffect, useState, useRef } from 'react';
import { Plus, Play, Pause, Square, Calendar, TrendingUp, Loader2, RefreshCw, Edit2, Image, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  multiplier: number;
  budget_cap: number;
  enb_distributed: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  ended_at: string | null;
  eligible_actions: string[] | null;
  media_urls: string[] | null;
}

const ACTION_TYPES = [
  'neighbourhood_cleanup','recycling_dropoff','carpool','food_sharing',
  'skill_workshop','infrastructure_report','trade_job','youth_mentoring',
  'tree_planting','waste_reporting'
];

const CLOUDINARY_UPLOAD = 'https://api.cloudinary.com/v1_1/dl86obm3b/upload';

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showPastCampaigns, setShowPastCampaigns] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const emptyForm = { name: '', description: '', multiplier: '1.5', budget_cap: '', ends_at: '', eligible_actions: [] as string[], media_urls: [] as string[] };
  const [form, setForm] = useState(emptyForm);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase.from('campaigns').select('*').order('starts_at', { ascending: false });
    if (data) setCampaigns(data);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const uploadMedia = async (files: FileList) => {
    setMediaUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'enb_photos');
      fd.append('folder', 'enb/profiles/campaigns');
      const res = await fetch(CLOUDINARY_UPLOAD, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.secure_url) urls.push(data.secure_url);
    }
    setForm(prev => ({ ...prev, media_urls: [...prev.media_urls, ...urls] }));
    setMediaUploading(false);
  };

  const removeMedia = (url: string) => {
    setForm(prev => ({ ...prev, media_urls: prev.media_urls.filter(u => u !== url) }));
  };

  const handleCreate = async () => {
    if (!form.name || !form.budget_cap) { setError('Name and budget are required.'); return; }
    setSaving(true); setError('');
    try {
      const { error } = await supabase.from('campaigns').insert({
        name: form.name, description: form.description || null,
        multiplier: parseFloat(form.multiplier),
        budget_cap: parseInt(form.budget_cap), enb_distributed: 0,
        is_active: true, starts_at: new Date().toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        eligible_actions: form.eligible_actions.length > 0 ? form.eligible_actions : null,
        media_urls: form.media_urls.length > 0 ? form.media_urls : null,
      });
      if (error) throw error;
      setForm(emptyForm); setOpen(false); await fetchCampaigns();
    } catch (err: any) { setError(err.message || 'Failed to create campaign'); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editingCampaign || !form.name || !form.budget_cap) { setError('Name and budget are required.'); return; }
    setSaving(true); setError('');
    try {
      const { error } = await supabase.from('campaigns').update({
        name: form.name, description: form.description || null,
        multiplier: parseFloat(form.multiplier),
        budget_cap: parseInt(form.budget_cap),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        eligible_actions: form.eligible_actions.length > 0 ? form.eligible_actions : null,
        media_urls: form.media_urls.length > 0 ? form.media_urls : null,
      }).eq('id', editingCampaign.id);
      if (error) throw error;
      setEditingCampaign(null); setForm(emptyForm); await fetchCampaigns();
    } catch (err: any) { setError(err.message || 'Failed to update campaign'); }
    setSaving(false);
  };

  const openEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setForm({
      name: campaign.name, description: campaign.description || '',
      multiplier: campaign.multiplier.toString(),
      budget_cap: campaign.budget_cap.toString(),
      ends_at: campaign.ends_at ? campaign.ends_at.split('T')[0] : '',
      eligible_actions: campaign.eligible_actions || [],
      media_urls: campaign.media_urls || [],
    });
  };

  const endCampaign = async (campaign: Campaign) => {
    if (!confirm(`End "${campaign.name}"? This will stop the campaign but keep all history.`)) return;
    await supabase.from('campaigns').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', campaign.id);
    fetchCampaigns();
  };

  const toggleActive = async (campaign: Campaign) => {
    await supabase.from('campaigns').update({ is_active: !campaign.is_active }).eq('id', campaign.id);
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, is_active: !c.is_active } : c));
  };

  const toggleAction = (action: string) => {
    setForm(prev => ({
      ...prev,
      eligible_actions: prev.eligible_actions.includes(action)
        ? prev.eligible_actions.filter(a => a !== action)
        : [...prev.eligible_actions, action]
    }));
  };

  const getStatus = (c: Campaign) => {
    if (c.ended_at) return 'Ended';
    if (!c.is_active) return 'Paused';
    if (c.ends_at && new Date(c.ends_at) < new Date()) return 'Ended';
    return 'Active';
  };

  const activeCampaigns = campaigns.filter(c => getStatus(c) !== 'Ended');
  const pastCampaigns = campaigns.filter(c => getStatus(c) === 'Ended');

  const CampaignForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Campaign Name *</Label>
        <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Ramzan Cleanup Drive" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
          placeholder="What is this campaign about?" className="resize-none h-20" />
      </div>
      <div className="space-y-2">
        <Label>Reward Multiplier *</Label>
        <select className="w-full p-2 border border-gray-200 rounded-lg text-sm"
          value={form.multiplier} onChange={e => setForm({...form, multiplier: e.target.value})}>
          <option value="1.5">1.5× Bonus</option>
          <option value="2">2× Double Rewards</option>
          <option value="3">3× Triple Rewards</option>
          <option value="5">5× Special Event</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Budget Cap (ENB) *</Label>
        <Input type="number" value={form.budget_cap} onChange={e => setForm({...form, budget_cap: e.target.value})} placeholder="50000" />
      </div>
      <div className="space-y-2">
        <Label>End Date (optional)</Label>
        <Input type="date" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} />
      </div>

      {/* Media upload - Point 13 */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Image className="w-4 h-4" /> Campaign Media (photos/videos)</Label>
        {form.media_urls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {form.media_urls.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt={`media-${i}`} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                <button onClick={() => removeMedia(url)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => mediaInputRef.current?.click()}
          disabled={mediaUploading}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-3 text-sm text-gray-400 hover:border-enb-green/40 transition-colors flex items-center justify-center gap-2">
          {mediaUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Image className="w-4 h-4" /> Add photos or videos</>}
        </button>
        <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
          onChange={e => e.target.files && uploadMedia(e.target.files)} />
      </div>

      <div className="space-y-2">
        <Label>Eligible Actions (leave empty = all actions)</Label>
        <div className="grid grid-cols-2 gap-2">
          {ACTION_TYPES.map(action => (
            <label key={action} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={form.eligible_actions.includes(action)}
                onChange={() => toggleAction(action)} className="rounded" />
              <span className="capitalize">{action.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
      <Button onClick={editingCampaign ? handleEdit : handleCreate} disabled={saving} className="w-full bg-enb-green text-white">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editingCampaign ? 'Save Changes' : 'Launch Campaign'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Campaign Manager</h1>
          <p className="text-sm text-enb-text-secondary">Create and manage reward multipliers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setForm(emptyForm); setEditingCampaign(null); setError(''); } }}>
            <DialogTrigger asChild>
              <Button className="bg-enb-green text-white shadow-md shadow-enb-green/20">
                <Plus className="w-4 h-4 mr-2" />New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create New Campaign</DialogTitle></DialogHeader>
              <CampaignForm />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Edit dialog */}
      <Dialog open={!!editingCampaign} onOpenChange={o => { if (!o) { setEditingCampaign(null); setForm(emptyForm); setError(''); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Campaign</DialogTitle></DialogHeader>
          <CampaignForm />
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />Loading...
        </div>
      ) : (
        <>
          {/* Active + Paused campaigns */}
          {activeCampaigns.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No active campaigns.</p>
              <p className="text-sm mt-1">Create one to boost community participation.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeCampaigns.map(campaign => {
                const status = getStatus(campaign);
                const pct = campaign.budget_cap > 0 ? Math.min(100, Math.round((campaign.enb_distributed / campaign.budget_cap) * 100)) : 0;
                return (
                  <Card key={campaign.id} className="border-gray-100 shadow-sm">
                    <CardContent className="p-5">
                      {/* Media slideshow */}
                      {campaign.media_urls && campaign.media_urls.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                          {campaign.media_urls.map((url, i) => (
                            <img key={i} src={url} alt={`media-${i}`} className="h-24 w-36 object-cover rounded-xl flex-shrink-0 border border-gray-100" />
                          ))}
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                          }`}>{campaign.multiplier}×</div>
                          <div>
                            <h3 className="font-bold text-enb-text-primary">{campaign.name}</h3>
                            {campaign.description && <p className="text-xs text-gray-500 mt-0.5">{campaign.description}</p>}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full font-medium border ${
                                status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                              }`}>{status}</span>
                              {campaign.ends_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Ends {new Date(campaign.ends_at).toLocaleDateString('en-PK', { day:'numeric', month:'short' })}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 w-48">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>{campaign.enb_distributed.toLocaleString()} ENB used</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full">
                                <div className="h-full bg-enb-green rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-xs text-gray-400 mt-1">of {campaign.budget_cap.toLocaleString()} ENB cap</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button variant="outline" size="icon" onClick={() => openEdit(campaign)} title="Edit">
                            <Edit2 className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => toggleActive(campaign)}
                            className={status === 'Active' ? 'text-orange-600 border-orange-100' : 'text-green-600 border-green-100'}>
                            {status === 'Active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => endCampaign(campaign)}
                            className="text-red-500 border-red-100 hover:bg-red-50" title="End Campaign">
                            <Square className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Past campaigns - Point 12 */}
          {pastCampaigns.length > 0 && (
            <div>
              <button onClick={() => setShowPastCampaigns(!showPastCampaigns)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 mb-3">
                {showPastCampaigns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Past Campaigns ({pastCampaigns.length})
              </button>
              {showPastCampaigns && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Campaign</th>
                        <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Multiplier</th>
                        <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">ENB Used</th>
                        <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Budget</th>
                        <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Ended</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastCampaigns.map((c, i) => (
                        <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="p-3 font-medium text-enb-text-primary">{c.name}</td>
                          <td className="p-3 text-right text-enb-green font-bold">{c.multiplier}×</td>
                          <td className="p-3 text-right">{c.enb_distributed.toLocaleString()}</td>
                          <td className="p-3 text-right text-gray-400">{c.budget_cap.toLocaleString()}</td>
                          <td className="p-3 text-right text-gray-400 text-xs">
                            {(c.ended_at || c.ends_at) ? new Date(c.ended_at || c.ends_at!).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
