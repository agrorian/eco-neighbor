import { useState, useEffect } from 'react';
import { Phone, MapPin, Store, ChevronDown, ChevronUp, Loader2, CheckCircle, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { Navigate } from 'react-router-dom';
import { BUSINESS_CATEGORIES } from '@/lib/constants';

interface Application {
  id: string;
  business_name: string;
  category: string;
  owner_name: string;
  whatsapp: string;
  address: string;
  message: string;
  status: string;
  admin_review: string | null;
  admin_note: string | null;
  onboarding_notes: string | null;
  contacted_at: string | null;
  created_at: string;
  source: string;
  // Onboarding fields
  discount_description: string | null;
  redemption_items: string | null;
  enb_float_agreed: number | null;
}

export default function OnboardingQueue() {
  const { user } = useUserStore();
  if (!user || !['onboarding_team', 'admin'].includes(user.role || '')) return <Navigate to="/" replace />;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'contacted' | 'onboarded'>('pending');
  const [saving, setSaving] = useState<string | null>(null);

  // Form state for expanded application
  const [notes, setNotes] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [discountDesc, setDiscountDesc] = useState('');
  const [redemptionItems, setRedemptionItems] = useState('');
  const [floatAgreed, setFloatAgreed] = useState('');

  useEffect(() => { fetchApplications(); }, [activeTab]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('partner_applications')
      .select('*')
      .eq('status', activeTab)
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  const handleExpand = (app: Application) => {
    if (expandedId === app.id) { setExpandedId(null); return; }
    setExpandedId(app.id);
    setNotes(app.onboarding_notes || '');
    setOwnerName(app.owner_name || '');
    setWhatsapp(app.whatsapp || '');
    setAddress(app.address || '');
    setDiscountDesc(app.discount_description || '');
    setRedemptionItems(app.redemption_items || '');
    setFloatAgreed(app.enb_float_agreed?.toString() || '');
  };

  const markContacted = async (appId: string) => {
    setSaving(appId);
    await supabase.rpc('mark_application_contacted', {
      p_application_id: appId,
      p_team_member_id: user!.id,
      p_notes: notes || null,
    });
    setSaving(null);
    setExpandedId(null);
    fetchApplications();
  };

  const submitOnboarding = async (appId: string) => {
    if (!ownerName.trim() || !whatsapp.trim() || !discountDesc.trim()) {
      alert('Please fill in owner name, WhatsApp, and discount description.');
      return;
    }
    setSaving(appId);
    const { data } = await supabase.rpc('submit_onboarding_complete', {
      p_application_id: appId,
      p_team_member_id: user!.id,
      p_owner_name: ownerName,
      p_whatsapp: whatsapp,
      p_address: address,
      p_discount_description: discountDesc,
      p_redemption_items: redemptionItems,
      p_enb_float_agreed: parseInt(floatAgreed) || 5000,
      p_notes: notes || null,
    });
    setSaving(null);
    setExpandedId(null);
    fetchApplications();
  };

  const statusBadge = (app: Application) => {
    if (app.admin_review === 'returned')
      return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">↩ Returned by Admin</span>;
    if (app.admin_review === 'approved')
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✅ Approved</span>;
    if (app.admin_review === 'pending_review')
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">⏳ Awaiting Admin</span>;
    return null;
  };

  const tabs: { key: 'pending' | 'contacted' | 'onboarded'; label: string; color: string }[] = [
    { key: 'pending', label: 'New Applications', color: 'bg-orange-500' },
    { key: 'contacted', label: 'In Progress', color: 'bg-blue-500' },
    { key: 'onboarded', label: 'Submitted', color: 'bg-enb-green' },
  ];

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto">
      <header>
        <h1 className="text-xl font-bold text-enb-text-primary flex items-center gap-2">
          <Store className="w-5 h-5 text-enb-green" /> Business Onboarding Queue
        </h1>
        <p className="text-sm text-enb-text-secondary">Contact applicants and complete their onboarding</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.key ? `${tab.color} text-white shadow-sm` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-enb-green" /></div>
      ) : applications.length === 0 ? (
        <Card className="border-gray-100">
          <CardContent className="p-8 text-center">
            <Store className="w-10 h-10 mx-auto text-gray-200 mb-2" />
            <p className="text-enb-text-secondary">No applications in this category</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <Card key={app.id} className="border-gray-100 shadow-sm overflow-hidden">
              {/* Row */}
              <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleExpand(app)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm text-enb-text-primary">{app.business_name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{app.category}</span>
                      {statusBadge(app)}
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {app.owner_name && <div>👤 {app.owner_name}</div>}
                      {app.whatsapp && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.whatsapp}</div>}
                      {app.address && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.address}</div>}
                      <div>📅 {new Date(app.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  {expandedId === app.id ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </div>
              </div>

              {/* Expanded */}
              {expandedId === app.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                  {/* Admin note if returned */}
                  {app.admin_note && app.admin_review === 'returned' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-orange-700 mb-1">Admin Query:</p>
                      <p className="text-sm text-orange-800">{app.admin_note}</p>
                    </div>
                  )}

                  {/* Applicant message */}
                  {app.message && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Their Message</p>
                      <p className="text-sm text-enb-text-secondary">{app.message}</p>
                    </div>
                  )}

                  {/* WhatsApp quick link */}
                  {app.whatsapp && (
                    <a href={`https://wa.me/${app.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white text-xs">
                        <Phone className="w-4 h-4 mr-2" /> Open WhatsApp Chat
                      </Button>
                    </a>
                  )}

                  {/* Notes field */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this contact..." className="mt-1 resize-none h-20 text-sm" />
                  </div>

                  {/* If pending — just mark contacted */}
                  {app.status === 'pending' && (
                    <Button onClick={() => markContacted(app.id)} disabled={saving === app.id} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      {saving === app.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                      Mark as Contacted
                    </Button>
                  )}

                  {/* If contacted — full onboarding form */}
                  {(app.status === 'contacted') && (
                    <div className="space-y-3 border-t border-gray-200 pt-3">
                      <p className="text-xs font-bold text-enb-green uppercase tracking-wide">Complete Onboarding Details</p>
                      <p className="text-xs text-gray-400">Fill these in after your conversation with the business owner. Required before submitting for admin approval.</p>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Owner Name *</label>
                          <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Full name" className="mt-1 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium">WhatsApp *</label>
                          <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+92..." className="mt-1 text-sm" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 font-medium">Address</label>
                        <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" className="mt-1 text-sm" />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 font-medium">What discount/offer will they give? *</label>
                        <Textarea value={discountDesc} onChange={e => setDiscountDesc(e.target.value)} placeholder="e.g. 10% off on OTC medicines, 15% off on labour charges..." className="mt-1 resize-none h-20 text-sm" />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 font-medium">Specific ENB redemption items (if any)</label>
                        <Textarea value={redemptionItems} onChange={e => setRedemptionItems(e.target.value)} placeholder="e.g. 1kg flour = 500 ENB, one haircut = 1000 ENB..." className="mt-1 resize-none h-20 text-sm" />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 font-medium">ENB Float agreed (ENB)</label>
                        <Input type="number" value={floatAgreed} onChange={e => setFloatAgreed(e.target.value)} placeholder="5000" className="mt-1 text-sm" />
                      </div>

                      <Button onClick={() => submitOnboarding(app.id)} disabled={saving === app.id || !ownerName.trim() || !whatsapp.trim() || !discountDesc.trim()} className="w-full bg-enb-green text-white">
                        {saving === app.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Submit for Admin Approval — Earn 1,000 ENB
                      </Button>
                      <p className="text-xs text-gray-400 text-center">You earn ENB only after admin approves and business goes live.</p>
                    </div>
                  )}

                  {app.status === 'onboarded' && app.admin_review === 'pending_review' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                      <CheckCircle className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                      <p className="text-sm font-medium text-blue-700">Submitted — awaiting admin review</p>
                      <p className="text-xs text-blue-500 mt-1">You'll earn 1,000 ENB once approved</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
