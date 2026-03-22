import { useState, useEffect } from 'react';
import { CheckCircle, X, Loader2, Store, Users, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface PartnerApp {
  id: string;
  business_name: string;
  category: string;
  owner_name: string;
  whatsapp: string;
  address: string;
  discount_description: string;
  redemption_items: string;
  enb_float_agreed: number;
  onboarding_notes: string;
  admin_review: string | null;
  assigned_to: string | null;
  created_at: string;
  // joined
  team_member_name?: string;
}

interface VolunteerApp {
  id: string;
  user_id: string;
  motivation: string;
  experience: string;
  availability: string;
  status: string;
  created_at: string;
  // joined
  applicant_name?: string;
  applicant_email?: string;
  rep_score?: number;
}

export default function AdminOnboarding() {
  const { user } = useUserStore();
  const [partnerApps, setPartnerApps] = useState<PartnerApp[]>([]);
  const [volunteerApps, setVolunteerApps] = useState<VolunteerApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'partners' | 'volunteers'>('partners');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);

    // Fetch partner applications awaiting admin review
    const { data: apps } = await supabase
      .from('partner_applications')
      .select('*')
      .eq('admin_review', 'pending_review')
      .order('created_at', { ascending: true });

    // Fetch team member names
    if (apps && apps.length > 0) {
      const teamIds = [...new Set(apps.filter(a => a.assigned_to).map(a => a.assigned_to))];
      if (teamIds.length > 0) {
        const { data: teamMembers } = await supabase
          .from('users').select('id, full_name').in('id', teamIds);
        const teamMap = new Map((teamMembers || []).map(t => [t.id, t.full_name]));
        setPartnerApps(apps.map(a => ({ ...a, team_member_name: teamMap.get(a.assigned_to) || 'Unknown' })));
      } else {
        setPartnerApps(apps);
      }
    } else {
      setPartnerApps([]);
    }

    // Fetch volunteer applications
    const { data: vApps } = await supabase
      .from('volunteer_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (vApps && vApps.length > 0) {
      const userIds = vApps.map(v => v.user_id);
      const { data: vUsers } = await supabase
        .from('users').select('id, full_name, email, rep_score').in('id', userIds);
      const userMap = new Map((vUsers || []).map(u => [u.id, u]));
      setVolunteerApps(vApps.map(v => ({
        ...v,
        applicant_name: userMap.get(v.user_id)?.full_name || 'Unknown',
        applicant_email: userMap.get(v.user_id)?.email || '',
        rep_score: userMap.get(v.user_id)?.rep_score || 0,
      })));
    } else {
      setVolunteerApps([]);
    }

    setLoading(false);
  };

  const approvePartner = async (appId: string) => {
    setSaving(appId);
    await supabase.rpc('approve_partner_application', {
      p_application_id: appId,
      p_admin_id: user!.id,
      p_admin_note: adminNote || null,
      p_enb_reward: 1000,
    });
    setSaving(null); setExpandedId(null); setAdminNote('');
    fetchAll();
  };

  const returnPartner = async (appId: string) => {
    if (!adminNote.trim()) { alert('Please add a note explaining what needs to be corrected.'); return; }
    setSaving(appId);
    await supabase.rpc('return_partner_application', {
      p_application_id: appId,
      p_admin_note: adminNote,
    });
    setSaving(null); setExpandedId(null); setAdminNote('');
    fetchAll();
  };

  const approveVolunteer = async (vApp: VolunteerApp) => {
    setSaving(vApp.id);
    // Update volunteer application
    await supabase.from('volunteer_applications').update({
      status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString()
    }).eq('id', vApp.id);
    // Update user role
    await supabase.from('users').update({ role: 'onboarding_team' }).eq('id', vApp.user_id);
    setSaving(null); fetchAll();
  };

  const rejectVolunteer = async (vApp: VolunteerApp) => {
    setSaving(vApp.id);
    await supabase.from('volunteer_applications').update({
      status: 'rejected', reviewed_by: user!.id, reviewed_at: new Date().toISOString()
    }).eq('id', vApp.id);
    setSaving(null); fetchAll();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary">Onboarding Management</h1>
        <p className="text-sm text-enb-text-secondary">Review partner applications and volunteer requests</p>
      </header>

      {/* Section tabs */}
      <div className="flex gap-3">
        <button onClick={() => setActiveSection('partners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === 'partners' ? 'bg-enb-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Store className="w-4 h-4" /> Partner Applications
          {partnerApps.length > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeSection === 'partners' ? 'bg-white/20' : 'bg-enb-green text-white'}`}>{partnerApps.length}</span>}
        </button>
        <button onClick={() => setActiveSection('volunteers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === 'volunteers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Users className="w-4 h-4" /> Volunteer Applications
          {volunteerApps.length > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeSection === 'volunteers' ? 'bg-white/20' : 'bg-blue-500 text-white'}`}>{volunteerApps.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-enb-green" /></div>
      ) : activeSection === 'partners' ? (
        partnerApps.length === 0 ? (
          <Card className="border-gray-100"><CardContent className="p-8 text-center text-enb-text-secondary">No partner applications awaiting review</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {partnerApps.map(app => (
              <Card key={app.id} className="border-orange-100 shadow-sm overflow-hidden">
                <div className="p-4 cursor-pointer hover:bg-orange-50/50" onClick={() => { setExpandedId(expandedId === app.id ? null : app.id); setAdminNote(''); }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-enb-text-primary">{app.business_name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{app.category}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Onboarded by: <span className="font-medium">{app.team_member_name}</span>
                      </div>
                    </div>
                    {expandedId === app.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {expandedId === app.id && (
                  <div className="border-t border-orange-100 bg-orange-50/30 p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-xs text-gray-400 uppercase">Owner</span><p className="font-medium">{app.owner_name}</p></div>
                      <div><span className="text-xs text-gray-400 uppercase">WhatsApp</span><p className="font-medium">{app.whatsapp}</p></div>
                      <div className="col-span-2"><span className="text-xs text-gray-400 uppercase">Address</span><p className="font-medium">{app.address || '—'}</p></div>
                    </div>
                    <div><span className="text-xs text-gray-400 uppercase">Discount Offer</span><p className="text-sm mt-0.5">{app.discount_description || '—'}</p></div>
                    {app.redemption_items && <div><span className="text-xs text-gray-400 uppercase">Redemption Items</span><p className="text-sm mt-0.5">{app.redemption_items}</p></div>}
                    <div><span className="text-xs text-gray-400 uppercase">Float Agreed</span><p className="text-sm font-bold text-enb-green">{(app.enb_float_agreed || 5000).toLocaleString()} ENB</p></div>
                    {app.onboarding_notes && <div><span className="text-xs text-gray-400 uppercase">Team Notes</span><p className="text-sm mt-0.5 italic">{app.onboarding_notes}</p></div>}

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Admin Note (required for return, optional for approval)</label>
                      <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add a note..." className="mt-1 resize-none h-16 text-sm" />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => approvePartner(app.id)} disabled={saving === app.id} className="flex-1 bg-enb-green text-white text-sm">
                        {saving === app.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                        Approve — Pay 1,000 ENB
                      </Button>
                      <Button onClick={() => returnPartner(app.id)} disabled={saving === app.id} variant="outline" className="flex-1 border-orange-300 text-orange-700 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" /> Return with Query
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      ) : (
        volunteerApps.length === 0 ? (
          <Card className="border-gray-100"><CardContent className="p-8 text-center text-enb-text-secondary">No volunteer applications pending</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {volunteerApps.map(app => (
              <Card key={app.id} className="border-blue-100 shadow-sm overflow-hidden">
                <div className="p-4 cursor-pointer hover:bg-blue-50/30" onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-enb-text-primary">{app.applicant_name}</p>
                      <p className="text-xs text-gray-500">{app.applicant_email} · {app.rep_score?.toLocaleString()} Rep</p>
                    </div>
                    {expandedId === app.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
                {expandedId === app.id && (
                  <div className="border-t border-blue-100 bg-blue-50/30 p-4 space-y-3">
                    <div><p className="text-xs text-gray-400 uppercase font-semibold">Motivation</p><p className="text-sm mt-1">{app.motivation}</p></div>
                    {app.experience && <div><p className="text-xs text-gray-400 uppercase font-semibold">Experience</p><p className="text-sm mt-1">{app.experience}</p></div>}
                    {app.availability && <div><p className="text-xs text-gray-400 uppercase font-semibold">Availability</p><p className="text-sm mt-1">{app.availability}</p></div>}
                    <div className="flex gap-2">
                      <Button onClick={() => approveVolunteer(app)} disabled={saving === app.id} className="flex-1 bg-blue-600 text-white text-sm">
                        {saving === app.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                        Approve — Assign Role
                      </Button>
                      <Button onClick={() => rejectVolunteer(app)} disabled={saving === app.id} variant="outline" className="flex-1 text-sm">
                        <X className="w-4 h-4 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
