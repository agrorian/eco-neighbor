import { useState, useEffect } from 'react';
import { Store, XCircle, MoreVertical, FileText, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { BUSINESS_CATEGORIES as CATEGORIES } from '@/lib/constants';

interface Partner {
  id: string;
  business_name: string;
  category: string;
  address: string;
  phone: string;
  whatsapp: string;
  discount_offer: string;
  enb_float: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  gps_lat: number | null;
  gps_lng: number | null;
}

interface NewPartnerForm {
  business_name: string;
  category: string;
  address: string;
  phone: string;
  whatsapp: string;
  discount_offer: string;
  enb_float: string;
  email: string;
  password: string;
}

const EMPTY_FORM: NewPartnerForm = {
  business_name: '',
  category: '',
  address: '',
  phone: '',
  whatsapp: '',
  discount_offer: '',
  enb_float: '5000',
  email: '',
  password: '',
};

export default function PartnerManager() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewPartnerForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editFloat, setEditFloat] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editGpsLat, setEditGpsLat] = useState('');
  const [editGpsLng, setEditGpsLng] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('business_partners')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPartners(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    await supabase
      .from('business_partners')
      .update({ is_verified: true, is_active: true })
      .eq('id', id);
    fetchPartners();
  };

  const handleViewDetails = (partner: Partner) => {
    setSelectedPartner(partner);
    setEditEmail('');
    setEditFloat(partner.enb_float?.toString() || '5000');
    setEditSuccess('');
    setEditGpsLat(partner.gps_lat?.toString() || '');
    setEditGpsLng(partner.gps_lng?.toString() || '');
    setShowDetailModal(true);
  };

  const handleSaveEdits = async () => {
    if (!selectedPartner) return;
    setEditSaving(true);
    setEditSuccess('');

    // Update float
    const { error: floatError } = await supabase
      .from('business_partners')
      .update({
        enb_float: parseInt(editFloat) || selectedPartner.enb_float,
        gps_lat: editGpsLat ? parseFloat(editGpsLat) : selectedPartner.gps_lat,
        gps_lng: editGpsLng ? parseFloat(editGpsLng) : selectedPartner.gps_lng,
      })
      .eq('id', selectedPartner.id);

    // Update email if provided (admin only action)
    if (editEmail.trim() && editEmail.includes('@')) {
      // Update in users table
      const { data: ownerData } = await supabase
        .from('business_partners')
        .select('owner_user_id')
        .eq('id', selectedPartner.id)
        .single();

      if (ownerData?.owner_user_id) {
        await supabase
          .from('users')
          .update({ email: editEmail.trim().toLowerCase() })
          .eq('id', ownerData.owner_user_id);
      }
    }

    if (!floatError) {
      setEditSuccess('Changes saved successfully.');
      fetchPartners();
      setTimeout(() => {
        setShowDetailModal(false);
        setEditSuccess('');
      }, 1500);
    }
    setEditSaving(false);
  };

  const handleSuspend = async (id: string) => {
    await supabase
      .from('business_partners')
      .update({ is_active: false })
      .eq('id', id);
    fetchPartners();
  };

  const handleAddPartner = async () => {
    setFormError('');
    if (!form.business_name.trim() || !form.category || !form.email.trim() || !form.password.trim()) {
      setFormError('Business name, category, email and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create auth user for the business
      const { data: authData, error: authError } = await supabase.auth.admin
        ? { data: null, error: { message: 'Use service role' } }
        : { data: null, error: null };

      // Save current admin session before signUp replaces it
      const { data: adminSession } = await supabase.auth.getSession();
      const adminAccessToken = adminSession.session?.access_token;
      const adminRefreshToken = adminSession.session?.refresh_token;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: { data: { full_name: form.business_name } }
      });

      if (signUpError) throw new Error(signUpError.message);
      if (!signUpData.user) throw new Error('User creation failed.');

      const userId = signUpData.user.id;

      // Immediately restore admin session so admin stays logged in
      if (adminAccessToken && adminRefreshToken) {
        await supabase.auth.setSession({
          access_token: adminAccessToken,
          refresh_token: adminRefreshToken,
        });
      }

      // Step 2: Upsert users row with business role
      await supabase.from('users').upsert({
        id: userId,
        email: form.email.trim().toLowerCase(),
        full_name: form.business_name,
        role: 'business',
        enb_local_bal: 0,
        enb_global_bal: 0,
        rep_score: 0,
        tier: 'Newcomer',
        is_active: true,
        whatsapp_number: form.whatsapp || null,
      }, { onConflict: 'id' });

      // Step 3: Insert business_partners row
      const { error: partnerError } = await supabase.from('business_partners').insert({
        owner_user_id: userId,
        business_name: form.business_name.trim(),
        category: form.category,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        discount_offer: form.discount_offer.trim() || null,
        enb_float: parseInt(form.enb_float) || 5000,
        is_active: true,
        is_verified: false,
      });

      if (partnerError) throw new Error(partnerError.message);

      setFormSuccess(`Partner "${form.business_name}" created. Login: ${form.email}`);
      setForm(EMPTY_FORM);
      fetchPartners();
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess('');
      }, 2500);

    } catch (err: any) {
      setFormError(err.message || 'Failed to create partner.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: keyof NewPartnerForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Partner Manager</h1>
          <p className="text-sm text-enb-text-secondary">Manage business relationships</p>
        </div>
        <Button
          onClick={() => { setShowModal(true); setFormError(''); setFormSuccess(''); }}
          className="bg-enb-green hover:bg-enb-green/90 text-white shadow-md shadow-enb-green/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-enb-green" />
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-16 text-enb-text-secondary">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No partners yet.</p>
          <p className="text-sm mt-1">Click "Add Partner" to onboard the first business.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {partners.map((partner) => (
            <Card key={partner.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-enb-green/10 rounded-full flex items-center justify-center text-enb-green font-bold text-lg flex-shrink-0">
                    {partner.business_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-enb-text-primary">{partner.business_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">
                        {partner.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        partner.is_active && partner.is_verified
                          ? 'bg-green-100 text-green-700'
                          : partner.is_active && !partner.is_verified
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {partner.is_active && partner.is_verified ? 'Active' : partner.is_active ? 'Pending' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-500">Float</div>
                    <div className="font-bold text-enb-text-primary">{(partner.enb_float || 0).toLocaleString()} ENB</div>
                  </div>

                  <div className="flex gap-2 items-center">
                    {partner.is_active && !partner.is_verified && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(partner.id)}
                          className="bg-green-600 hover:bg-green-700 text-white">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => handleSuspend(partner.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50">
                          Reject
                        </Button>
                      </>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(partner)}>
                          <FileText className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        {partner.is_active ? (
                          <DropdownMenuItem className="text-red-600" onClick={() => handleSuspend(partner.id)}>
                            <XCircle className="w-4 h-4 mr-2" /> Suspend Partner
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600" onClick={() => handleApprove(partner.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" /> Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Partner Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-enb-green" />
              Add New Partner
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Business Info */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Info</p>
              <Input placeholder="Business name *" value={form.business_name} onChange={set('business_name')} />
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Category *" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Address" value={form.address} onChange={set('address')} />
              <Input placeholder="Phone number" value={form.phone} onChange={set('phone')} />
              <Input placeholder="WhatsApp number" value={form.whatsapp} onChange={set('whatsapp')} />
              <Input placeholder="Discount offer (e.g. 10% Off)" value={form.discount_offer} onChange={set('discount_offer')} />
              <Input placeholder="ENB Float amount" type="number" value={form.enb_float} onChange={set('enb_float')} />
            </div>

            {/* Login Credentials */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Login Credentials</p>
              <p className="text-xs text-gray-500">These will be shared with the business owner to access their dashboard.</p>
              <Input placeholder="Email address *" type="email" value={form.email} onChange={set('email')} />
              <Input placeholder="Password * (min 6 chars)" type="password" value={form.password} onChange={set('password')} />
            </div>

            {formError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {formSuccess}
              </div>
            )}

            <Button
              onClick={handleAddPartner}
              disabled={submitting}
              className="w-full bg-enb-green hover:bg-enb-green/90 text-white"
            >
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Partner Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

      {/* Partner Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-enb-green" />
              {selectedPartner?.business_name}
            </DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4 pt-2">
              {/* Read-only info */}
              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
                <div><p className="text-xs text-gray-400 uppercase">Category</p><p className="font-medium">{selectedPartner.category}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Status</p><p className={`font-medium ${selectedPartner.is_active ? 'text-enb-green' : 'text-red-500'}`}>{selectedPartner.is_active ? 'Active' : 'Suspended'}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Phone</p><p className="font-medium">{selectedPartner.phone || '—'}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">WhatsApp</p><p className="font-medium">{selectedPartner.whatsapp || '—'}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400 uppercase">Address</p><p className="font-medium">{selectedPartner.address || '—'}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400 uppercase">Discount Offer</p><p className="font-medium">{selectedPartner.discount_offer || '—'}</p></div>
                {selectedPartner.gps_lat && selectedPartner.gps_lng && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 uppercase">GPS Location</p>
                    <a href={`https://maps.google.com/?q=${selectedPartner.gps_lat},${selectedPartner.gps_lng}`} target="_blank" rel="noopener noreferrer" className="text-sm text-enb-green hover:underline">
                      {selectedPartner.gps_lat.toFixed(5)}, {selectedPartner.gps_lng.toFixed(5)} (Open in Maps)
                    </a>
                  </div>
                )}
              </div>

              {/* Editable fields — admin only */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Admin Editable</p>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-enb-text-primary">ENB Float</label>
                  <Input
                    type="number"
                    value={editFloat}
                    onChange={e => setEditFloat(e.target.value)}
                    placeholder="Float amount"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-enb-text-primary">GPS Latitude</label>
                    <Input type="number" step="any" value={editGpsLat} onChange={e => setEditGpsLat(e.target.value)} placeholder="33.58141" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-enb-text-primary">GPS Longitude</label>
                    <Input type="number" step="any" value={editGpsLng} onChange={e => setEditGpsLng(e.target.value)} placeholder="73.10346" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-enb-text-primary flex items-center gap-2">
                    Change Login Email
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Admin Only</span>
                  </label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="Leave blank to keep current email"
                  />
                  <p className="text-xs text-gray-400">Only fill this to change the business login email.</p>
                </div>

                {editSuccess && <p className="text-sm text-enb-green font-medium">{editSuccess}</p>}

                <Button onClick={handleSaveEdits} disabled={editSaving} className="w-full bg-enb-green text-white">
                  {editSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
