import { useState, useEffect } from 'react';
import { Plus, Tag, Coins, Trash2, Loader2, Edit2, CheckCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { Navigate } from 'react-router-dom';

interface Offer {
  id: string;
  category: 'discount' | 'swap';
  item_name: string;
  description: string;
  discount_pct: number | null;
  valid_until: string | null;
  enb_cost: number | null;
  is_active: boolean;
  photo_url: string | null;
}

export default function BusinessOffers() {
  const { user } = useUserStore();
  if (!user || user.role !== 'business') return <Navigate to="/" replace />;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [partnerId, setPartnerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'discount' | 'swap'>('discount');
  const [saving, setSaving] = useState(false);

  // Form state
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [enbCost, setEnbCost] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => { fetchOffers(); }, []);

  const fetchOffers = async () => {
    setLoading(true);

    // Step 1: Get partner_id directly (reliable even if no offers exist yet)
    const { data: partnerData } = await supabase
      .from('business_partners')
      .select('id')
      .eq('owner_user_id', user!.id)
      .single();

    if (partnerData?.id) {
      setPartnerId(partnerData.id);

      // Step 2: Fetch offers for this partner
      const { data: offersData } = await supabase
        .from('business_offers')
        .select('*')
        .eq('partner_id', partnerData.id)
        .order('category')
        .order('created_at', { ascending: false });

      setOffers(offersData || []);
    }
    setLoading(false);
  };

  const uploadPhoto = async (file: File) => {
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'enb_photos');
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dl86obm3b/image/upload', {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      setPhotoUrl(data.secure_url || '');
    } catch { /* silent fail */ }
    setPhotoUploading(false);
  };

  const resetForm = () => {
    setItemName(''); setDescription(''); setDiscountPct(''); setPhotoUrl('');
    setValidUntil(''); setEnbCost(''); setShowForm(false);
  };

  const handleSave = async () => {
    if (!itemName.trim() || !partnerId) return;
    if (formType === 'discount' && !discountPct) return;
    if (formType === 'swap' && !enbCost) return;

    setSaving(true);
    const { error } = await supabase.from('business_offers').insert({
      partner_id: partnerId,
      owner_user_id: user!.id,
      category: formType,
      item_name: itemName.trim(),
      description: description.trim() || null,
      discount_pct: formType === 'discount' ? parseInt(discountPct) : null,
      valid_until: formType === 'discount' && validUntil ? validUntil : null,
      enb_cost: formType === 'swap' ? parseInt(enbCost) : null,
      is_active: true,
      photo_url: photoUrl || null,
    });

    if (!error) { resetForm(); fetchOffers(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('business_offers').update({ is_active: !current }).eq('id', id);
    fetchOffers();
  };

  const deleteOffer = async (id: string) => {
    await supabase.from('business_offers').delete().eq('id', id);
    fetchOffers();
  };

  const discountOffers = offers.filter(o => o.category === 'discount');
  const redemptionOffers = offers.filter(o => o.category === 'swap');

  return (
    <div className="space-y-5 pb-24 max-w-lg mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">My Offers</h1>
          <p className="text-sm text-enb-text-secondary">Manage discounts and ENB redemption items</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm" className="bg-enb-green text-white">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </header>

      {/* Add offer form */}
      {showForm && (
        <Card className="border-enb-green/20 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-enb-text-primary text-sm">New Offer</h3>
              <button onClick={resetForm}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormType('discount')}
                className={`py-2 rounded-lg text-sm font-semibold border transition-all ${formType === 'discount' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
              >
                <Tag className="w-4 h-4 inline mr-1" /> Discount
              </button>
              <button
                onClick={() => setFormType('swap')}
                className={`py-2 rounded-lg text-sm font-semibold border transition-all ${formType === 'swap' ? 'bg-enb-green/10 border-enb-green/30 text-enb-green' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
              >
                <Coins className="w-4 h-4 inline mr-1" /> ENB Swap
              </button>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
              {formType === 'discount'
                ? '💡 Voluntary discount on slow-moving or surplus stock. You decide the % and duration.'
                : '💡 Fixed items customers can pay for using ENB. Only list items you can honour consistently.'}
            </div>

            <Input placeholder="Item name (e.g. Bread, Oil Change, Paracetamol)" value={itemName} onChange={e => setItemName(e.target.value)} />
            <Input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />

            {/* Photo upload */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Photo (optional)</label>
              {photoUrl ? (
                <div className="relative">
                  <img src={photoUrl} alt="offer" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
                  <button onClick={() => setPhotoUrl('')} className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg">Remove</button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-enb-green/40 transition-colors">
                  {photoUploading ? <><span className="text-xs text-gray-400">Uploading...</span></> : <><span className="text-xs text-gray-400">Tap to add photo</span></>}
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} disabled={photoUploading} />
                </label>
              )}
            </div>

            {formType === 'discount' ? (
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Discount %" min="1" max="100" value={discountPct} onChange={e => setDiscountPct(e.target.value)} />
                <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} title="Valid until (optional)" />
              </div>
            ) : (
              <Input type="number" placeholder="ENB cost to redeem" min="1" value={enbCost} onChange={e => setEnbCost(e.target.value)} />
            )}

            <Button onClick={handleSave} disabled={saving || !itemName.trim()} className="w-full bg-enb-green text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save Offer
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-enb-green" /></div>
      ) : (
        <>
          {/* Discount Offers */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-amber-600" />
              <h2 className="font-bold text-enb-text-primary text-sm uppercase tracking-wide">Discount Offers</h2>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{discountOffers.length}</span>
            </div>
            {discountOffers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No discount offers yet</p>
            ) : (
              <div className="space-y-2">
                {discountOffers.map(offer => (
                  <OfferCard key={offer.id} offer={offer} onToggle={toggleActive} onDelete={deleteOffer} />
                ))}
              </div>
            )}
          </section>

          {/* ENB Swap Items */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-enb-green" />
              <h2 className="font-bold text-enb-text-primary text-sm uppercase tracking-wide">ENB Swap Items</h2>
              <span className="text-xs bg-enb-green/10 text-enb-green px-2 py-0.5 rounded-full">{redemptionOffers.length}</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Only list items you can reliably honour. Customers will see these in your directory listing.</p>
            {redemptionOffers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No redemption items yet</p>
            ) : (
              <div className="space-y-2">
                {redemptionOffers.map(offer => (
                  <OfferCard key={offer.id} offer={offer} onToggle={toggleActive} onDelete={deleteOffer} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function OfferCard({ offer, onToggle, onDelete }: { offer: Offer; onToggle: (id: string, current: boolean) => void; onDelete: (id: string) => void }) {
  return (
    <div className={`flex items-start justify-between p-4 rounded-xl border transition-all ${offer.is_active ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-enb-text-primary">{offer.item_name}</span>
          {offer.category === 'discount' && offer.discount_pct && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{offer.discount_pct}% off</span>
          )}
          {offer.category === 'swap' && offer.enb_cost && (
            <span className="text-xs bg-enb-green/10 text-enb-green px-2 py-0.5 rounded-full font-bold">{offer.enb_cost.toLocaleString()} ENB</span>
          )}
          {!offer.is_active && <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Paused</span>}
        </div>
        {offer.description && <p className="text-xs text-gray-500 mt-0.5">{offer.description}</p>}
        {offer.valid_until && <p className="text-xs text-orange-500 mt-0.5">Until {new Date(offer.valid_until).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</p>}
        {offer.photo_url && <img src={offer.photo_url} alt={offer.item_name} className="w-full h-24 object-cover rounded-lg mt-2 border border-gray-100" />}
      </div>
      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
        <button onClick={() => onToggle(offer.id, offer.is_active)} className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${offer.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-enb-green hover:bg-enb-green/5'}`}>
          {offer.is_active ? 'Pause' : 'Resume'}
        </button>
        <button onClick={() => onDelete(offer.id)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
