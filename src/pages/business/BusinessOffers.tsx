import { useState, useEffect } from 'react';
import {
  Plus, Tag, Coins, Trash2, Loader2, Edit2,
  CheckCircle, X, Camera, Eye, EyeOff, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, getDb } from '@/lib/supabase';
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

  const [offers, setOffers] = useState<Offer[]>([]);
  const [partnerId, setPartnerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'discount' | 'swap'>('discount');
  const [saving, setSaving] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [editValidUntil, setEditValidUntil] = useState('');
  const [editEnbCost, setEditEnbCost] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editPhotoUploading, setEditPhotoUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Form state
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [enbCost, setEnbCost] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (user?.role === 'business') fetchOffers();
  }, [user?.id]);

  if (!user || user.role !== 'business') return <Navigate to="/" replace />;

  const fetchOffers = async () => {
    setLoading(true);
    const { data: partnerData } = await supabase
      .from('business_partners')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (partnerData?.id) {
      setPartnerId(partnerData.id);
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

  const uploadPhoto = async (file: File, onDone: (url: string) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'enb_photos');
    formData.append('folder', 'enb/profiles/offers');
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dl86obm3b/image/upload', {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      if (data.secure_url) onDone(data.secure_url);
    } catch { /* silent */ }
  };

  const resetForm = () => {
    setItemName(''); setDescription(''); setDiscountPct('');
    setPhotoUrl(''); setValidUntil(''); setEnbCost(''); setShowForm(false);
  };

  const handleSave = async () => {
    if (!itemName.trim() || !partnerId) return;
    if (formType === 'discount' && !discountPct) return;
    if (formType === 'swap' && !enbCost) return;

    setSaving(true);
    const { error } = await getDb().from('business_offers').insert({
      partner_id: partnerId,
      owner_user_id: user.id,
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

  const handleEditOpen = (offer: Offer) => {
    setEditingOffer(offer);
    setEditName(offer.item_name);
    setEditDesc(offer.description || '');
    setEditDiscount(offer.discount_pct?.toString() || '');
    setEditValidUntil(offer.valid_until?.split('T')[0] || '');
    setEditEnbCost(offer.enb_cost?.toString() || '');
    setEditPhotoUrl(offer.photo_url || '');
  };

  const handleEditSave = async () => {
    if (!editingOffer || !editName.trim()) return;
    setEditSaving(true);
    await getDb().from('business_offers').update({
      item_name: editName.trim(),
      description: editDesc.trim() || null,
      discount_pct: editingOffer.category === 'discount' ? parseInt(editDiscount) || null : null,
      valid_until: editingOffer.category === 'discount' && editValidUntil ? editValidUntil : null,
      enb_cost: editingOffer.category === 'swap' ? parseInt(editEnbCost) || null : null,
      photo_url: editPhotoUrl || null,
    }).eq('id', editingOffer.id);
    setEditingOffer(null);
    setEditSaving(false);
    fetchOffers();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await getDb().from('business_offers').update({ is_active: !current }).eq('id', id);
    fetchOffers();
  };

  const deleteOffer = async (id: string) => {
    if (!confirm('Delete this offer? This cannot be undone.')) return;
    await getDb().from('business_offers').delete().eq('id', id);
    fetchOffers();
  };

  const discountOffers = offers.filter(o => o.category === 'discount');
  const swapOffers = offers.filter(o => o.category === 'swap');

  return (
    <div className="space-y-5 pb-24 max-w-lg mx-auto">

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">My Offers</h1>
          <p className="text-sm text-enb-text-secondary">What customers see in your directory listing</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm" className="bg-enb-green text-white">
            <Plus className="w-4 h-4 mr-1" /> Add Offer
          </Button>
        )}
      </header>

      {/* ── ADD FORM ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-enb-text-primary">New Offer</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFormType('discount')}
              className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                formType === 'discount'
                  ? 'bg-amber-50 border-amber-400 text-amber-800'
                  : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-200'
              }`}
            >
              <Tag className="w-4 h-4 inline mr-1.5" />Discount
            </button>
            <button
              onClick={() => setFormType('swap')}
              className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                formType === 'swap'
                  ? 'bg-enb-green/10 border-enb-green text-enb-green'
                  : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-200'
              }`}
            >
              <Coins className="w-4 h-4 inline mr-1.5" />ENB SWAP Item
            </button>
          </div>

          {/* Type explanation */}
          <div className="flex gap-2 bg-blue-50 rounded-xl p-3">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              {formType === 'discount'
                ? 'A % discount for community members on a specific item. You set the percentage and how long it lasts.'
                : 'A fixed item customers can pay for using ENB.LOCAL. Only add items you can reliably provide — this is what members will use their earned ENB for.'}
            </p>
          </div>

          {/* Photo upload */}
          <div>
            <label className="text-xs font-semibold text-enb-text-secondary uppercase tracking-wide block mb-2">
              Photo <span className="font-normal text-gray-400">(recommended)</span>
            </label>
            {photoUrl ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={photoUrl} alt="offer" className="w-full h-40 object-cover" />
                <button
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-enb-green/40 hover:bg-enb-green/5 transition-all">
                {photoUploading
                  ? <><Loader2 className="w-5 h-5 animate-spin text-gray-400" /><span className="text-xs text-gray-400">Uploading...</span></>
                  : <><Camera className="w-5 h-5 text-gray-300" /><span className="text-xs text-gray-400">Tap to add a photo</span><span className="text-xs text-gray-300">Offers with photos get more attention</span></>
                }
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={async e => {
                    if (!e.target.files?.[0]) return;
                    setPhotoUploading(true);
                    await uploadPhoto(e.target.files[0], url => setPhotoUrl(url));
                    setPhotoUploading(false);
                  }}
                  disabled={photoUploading}
                />
              </label>
            )}
          </div>

          {/* Item details */}
          <div className="space-y-2">
            <Input
              placeholder={formType === 'discount' ? 'Item name (e.g. LED Bulb 13W, Bread, Oil Change)' : 'Item name (e.g. Cup of Chai, Haircut, Bread Loaf)'}
              value={itemName}
              onChange={e => setItemName(e.target.value)}
            />
            <Input
              placeholder="Short description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {formType === 'discount' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Discount %</label>
                <Input
                  type="number" placeholder="e.g. 10" min="1" max="100"
                  value={discountPct} onChange={e => setDiscountPct(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Valid until (optional)</label>
                <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ENB cost to SWAP</label>
              <Input
                type="number" placeholder="e.g. 500" min="1"
                value={enbCost} onChange={e => setEnbCost(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                Members will spend this much ENB.LOCAL to get this item.
              </p>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || !itemName.trim() || (formType === 'discount' ? !discountPct : !enbCost)}
            className="w-full bg-enb-green text-white"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
              : <><CheckCircle className="w-4 h-4 mr-2" />Publish Offer</>
            }
          </Button>
        </div>
      )}

      {/* ── OFFER LISTS ── */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-enb-green" />
        </div>
      ) : offers.length === 0 && !showForm ? (
        /* Empty state */
        <div className="text-center py-12 space-y-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Tag className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-enb-text-primary">No offers yet</p>
          <p className="text-sm text-enb-text-secondary max-w-xs mx-auto">
            Add a discount offer or an ENB SWAP item. These appear on your business profile and attract community members.
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-enb-green text-white mt-2">
            <Plus className="w-4 h-4 mr-1" /> Add your first offer
          </Button>
        </div>
      ) : (
        <>
          {/* Discount Offers */}
          {discountOffers.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Tag className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-enb-text-primary text-sm uppercase tracking-wide">Discount Offers</h2>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{discountOffers.length}</span>
              </div>
              {discountOffers.map(offer => (
                <OfferCard key={offer.id} offer={offer} onToggle={toggleActive} onDelete={deleteOffer} onEdit={handleEditOpen} />
              ))}
            </section>
          )}

          {/* ENB SWAP Items */}
          {swapOffers.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Coins className="w-4 h-4 text-enb-green" />
                <h2 className="font-semibold text-enb-text-primary text-sm uppercase tracking-wide">ENB SWAP Items</h2>
                <span className="text-xs bg-enb-green/10 text-enb-green px-2 py-0.5 rounded-full font-medium">{swapOffers.length}</span>
              </div>
              <p className="text-xs text-gray-400 px-1">Members can spend their ENB.LOCAL on these items at your business.</p>
              {swapOffers.map(offer => (
                <OfferCard key={offer.id} offer={offer} onToggle={toggleActive} onDelete={deleteOffer} onEdit={handleEditOpen} />
              ))}
            </section>
          )}
        </>
      )}

      {/* ── EDIT MODAL ── */}
      {editingOffer && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
          onClick={() => setEditingOffer(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-enb-text-primary">Edit Offer</h3>
              <button onClick={() => setEditingOffer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo edit */}
            <div>
              <label className="text-xs font-semibold text-enb-text-secondary uppercase tracking-wide block mb-2">Photo</label>
              {editPhotoUrl ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={editPhotoUrl} alt="offer" className="w-full h-36 object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <label className="bg-black/60 text-white rounded-full p-1.5 cursor-pointer hover:bg-black/80">
                      {editPhotoUploading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Camera className="w-3.5 h-3.5" />
                      }
                      <input
                        type="file" accept="image/*" className="hidden"
                        onChange={async e => {
                          if (!e.target.files?.[0]) return;
                          setEditPhotoUploading(true);
                          await uploadPhoto(e.target.files[0], url => setEditPhotoUrl(url));
                          setEditPhotoUploading(false);
                        }}
                        disabled={editPhotoUploading}
                      />
                    </label>
                    <button
                      onClick={() => setEditPhotoUrl('')}
                      className="bg-red-500/80 text-white rounded-full p-1.5 hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 cursor-pointer hover:border-enb-green/40 hover:bg-enb-green/5 transition-all">
                  {editPhotoUploading
                    ? <><Loader2 className="w-4 h-4 animate-spin text-gray-400" /><span className="text-xs text-gray-400">Uploading...</span></>
                    : <><Camera className="w-4 h-4 text-gray-300" /><span className="text-xs text-gray-400">Add photo</span></>
                  }
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={async e => {
                      if (!e.target.files?.[0]) return;
                      setEditPhotoUploading(true);
                      await uploadPhoto(e.target.files[0], url => setEditPhotoUrl(url));
                      setEditPhotoUploading(false);
                    }}
                    disabled={editPhotoUploading}
                  />
                </label>
              )}
            </div>

            <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Item name *" />
            <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description (optional)" />

            {editingOffer.category === 'discount' && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number" value={editDiscount}
                  onChange={e => setEditDiscount(e.target.value)}
                  placeholder="Discount %"
                />
                <Input
                  type="date" value={editValidUntil}
                  onChange={e => setEditValidUntil(e.target.value)}
                  title="Valid until"
                />
              </div>
            )}
            {editingOffer.category === 'swap' && (
              <Input
                type="number" value={editEnbCost}
                onChange={e => setEditEnbCost(e.target.value)}
                placeholder="ENB cost"
              />
            )}

            <Button
              onClick={handleEditSave}
              disabled={editSaving || !editName.trim()}
              className="w-full bg-enb-green text-white"
            >
              {editSaving
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
                : <><CheckCircle className="w-4 h-4 mr-2" />Save Changes</>
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer, onToggle, onDelete, onEdit }: {
  offer: Offer;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (offer: Offer) => void;
}) {
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      offer.is_active ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      {/* Photo */}
      {offer.photo_url && (
        <img src={offer.photo_url} alt={offer.item_name} className="w-full h-36 object-cover" />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-enb-text-primary">{offer.item_name}</span>
              {!offer.is_active && (
                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Paused</span>
              )}
            </div>
            {offer.description && (
              <p className="text-xs text-enb-text-secondary mt-0.5">{offer.description}</p>
            )}
            {offer.valid_until && (
              <p className="text-xs text-orange-500 mt-0.5 font-medium">
                Valid until {new Date(offer.valid_until).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>

          {/* Badge */}
          <div className="flex-shrink-0">
            {offer.category === 'discount' && offer.discount_pct && (
              <span className="bg-amber-100 text-amber-700 text-sm font-bold px-2.5 py-1 rounded-full">
                {offer.discount_pct}% off
              </span>
            )}
            {offer.category === 'swap' && offer.enb_cost && (
              <span className="bg-enb-green/10 text-enb-green text-sm font-bold px-2.5 py-1 rounded-full">
                {offer.enb_cost.toLocaleString()} ENB
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => onEdit && onEdit(offer)}
            className="flex items-center gap-1 text-xs text-blue-500 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => onToggle(offer.id, offer.is_active)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
              offer.is_active
                ? 'text-orange-500 hover:bg-orange-50'
                : 'text-enb-green hover:bg-enb-green/5'
            }`}
          >
            {offer.is_active
              ? <><EyeOff className="w-3.5 h-3.5" /> Pause</>
              : <><Eye className="w-3.5 h-3.5" /> Resume</>
            }
          </button>
          <button
            onClick={() => onDelete(offer.id)}
            className="flex items-center gap-1 text-xs text-red-400 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
