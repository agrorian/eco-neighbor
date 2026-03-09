import { useEffect, useState } from 'react';
import { Plus, Play, Pause, Trash2, Calendar, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

interface Campaign {
  id: string;
  name: string;
  multiplier: number;
  budget_cap: number;
  enb_distributed: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  eligible_actions: string[] | null;
}

const ACTION_TYPES = [
  'neighbourhood_cleanup','recycling_dropoff','carpool','food_sharing',
  'skill_workshop','infrastructure_report','trade_job','youth_mentoring',
  'tree_planting','waste_reporting'
];

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', multiplier: '1.5', budget_cap: '', ends_at: '', eligible_actions: [] as string[]
  });
  const [error, setError] = useState('');

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('starts_at', { ascending: false });
    if (error) console.error('Campaigns fetch error:', error);
    if (data) setCampaigns(data);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.budget_cap) { setError('Name and budget are required.'); return; }
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase.from('campaigns').insert({
        name: form.name,
        multiplier: parseFloat(form.multiplier),
        budget_cap: parseInt(form.budget_cap),
        enb_distributed: 0,
        is_active: true,
        starts_at: new Date().toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        eligible_actions: form.eligible_actions.length > 0 ? form.eligible_actions : null,
      });
      if (error) throw error;
      setForm({ name: '', multiplier: '1.5', budget_cap: '', ends_at: '', eligible_actions: [] });
      setOpen(false);
      await fetchCampaigns();
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (campaign: Campaign) => {
    const { error } = await supabase
      .from('campaigns')
      .update({ is_active: !campaign.is_active })
      .eq('id', campaign.id);
    if (!error) setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, is_active: !c.is_active } : c));
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (!error) setCampaigns(prev => prev.filter(c => c.id !== id));
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
    if (!c.is_active) return 'Paused';
    if (c.ends_at && new Date(c.ends_at) < new Date()) return 'Ended';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Campaign Manager</h1>
          <p className="text-sm text-enb-text-secondary">Create and manage reward multipliers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-enb-green hover:bg-enb-green/90 text-white shadow-md shadow-enb-green/20">
                <Plus className="w-4 h-4 mr-2" />New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Ramazan Cleanup Drive" />
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
                <Button onClick={handleCreate} disabled={saving} className="w-full bg-enb-green text-white">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Launch Campaign'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />Loading campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No campaigns yet.</p>
          <p className="text-sm mt-1">Create your first campaign to boost community participation.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const status = getStatus(campaign);
            const pct = campaign.budget_cap > 0 ? Math.min(100, Math.round((campaign.enb_distributed / campaign.budget_cap) * 100)) : 0;
            return (
              <Card key={campaign.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        status === 'Active' ? 'bg-green-100 text-green-600' :
                        status === 'Paused' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {campaign.multiplier}×
                      </div>
                      <div>
                        <h3 className="font-bold text-enb-text-primary">{campaign.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full font-medium border ${
                            status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                            status === 'Paused' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            'bg-gray-50 text-gray-600 border-gray-100'
                          }`}>{status}</span>
                          {campaign.ends_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Ends {new Date(campaign.ends_at).toLocaleDateString('en-PK', { day:'numeric', month:'short' })}
                            </span>
                          )}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 w-48">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{campaign.enb_distributed.toLocaleString()} ENB used</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full">
                            <div className="h-full bg-enb-green rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">of {campaign.budget_cap.toLocaleString()} ENB cap</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {status !== 'Ended' && (
                        <Button variant="outline" size="icon" onClick={() => toggleActive(campaign)}
                          className={status === 'Active' ? 'text-orange-600 hover:bg-orange-50 border-orange-100' : 'text-green-600 hover:bg-green-50 border-green-100'}>
                          {status === 'Active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteCampaign(campaign.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
