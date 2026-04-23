import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Share2, X, AlertCircle, ChevronDown, Tag, Coins, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/store/user';
import { useT } from '@/contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';

interface Business {
  id: string;
  business_name: string;
  discount_offer: string;
}

interface BusinessOffer {
  id: string;
  category: 'discount' | 'swap';
  item_name: string;
  description: string;
  discount_pct: number | null;
  enb_cost: number | null;
  is_active: boolean;
}

export default function GenerateRedemptionQR() {
  const { l } = useT();
  const { user, setUser } = useUserStore();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState('');
  const [offers, setOffers] = useState<BusinessOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<BusinessOffer | null>(null);
  const [enbAmount, setEnbAmount] = useState('');
  const [qrData, setQrData] = useState<{ code: string; expiresAt: Date } | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('business_partners')
      .select('id, business_name, discount_offer')
      .eq('is_active', true)
      .then(({ data }) => { if (data) setBusinesses(data); });

    supabase.rpc('release_expired_redemptions').then(() => {});
  }, []);

  // Fetch offers when business selected
  useEffect(() => {
    if (!selectedBiz) { setOffers([]); setSelectedOffer(null); return; }
    supabase.from('business_offers')
      .select('*')
      .eq('partner_id', selectedBiz)
      .eq('is_active', true)
      .then(({ data }) => setOffers(data || []));
    setSelectedOffer(null);
    setEnbAmount('');
  }, [selectedBiz]);

  // Auto-set ENB amount from selected swap offer
  useEffect(() => {
    if (selectedOffer?.category === 'swap' && selectedOffer.enb_cost) {
      setEnbAmount(selectedOffer.enb_cost.toString());
    }
  }, [selectedOffer]);

  // Countdown timer
  useEffect(() => {
    if (!qrData) return;
    const interval = setInterval(() => {
      const secs = Math.max(0, Math.round((qrData.expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(secs);
      if (secs === 0) {
        setQrData(null);
        setQrImageUrl('');
        supabase.from('users').select('enb_local_bal').eq('id', user!.id).single()
          .then(({ data }) => { if (data) setUser({ ...user!, enb_local_bal: data.enb_local_bal }); });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [qrData]);

  // Generate QR image whenever qrData.code changes
  useEffect(() => {
    if (!qrData?.code) { setQrImageUrl(''); return; }
    const url = `https://eco-neighbor.vercel.app/scan?code=${qrData.code}`;
    QRCode.toDataURL(url, {
      width: 240,
      margin: 2,
      color: { dark: '#1A6B3C', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    }).then(setQrImageUrl).catch(console.error);
  }, [qrData?.code]);

  const handleGenerate = async () => {
    if (!user || !selectedBiz || !enbAmount) return;
    const amount = parseInt(enbAmount);
    if (isNaN(amount) || amount <= 0) { setError('Enter a valid ENB amount'); return; }
    if (amount > (user.enb_local_bal || 0)) { setError('Insufficient ENB balance'); return; }

    setLoading(true); setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('create_redemption_qr', {
        p_user_id: user.id,
        p_business_id: selectedBiz,
        p_enb_amount: amount,
      });
      if (rpcError) throw rpcError;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate QR');

      setUser({ ...user, enb_local_bal: (user.enb_local_bal || 0) - amount });
      setQrData({ code: data.qr_code, expiresAt: new Date(data.expires_at) });
      setSecondsLeft(600);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!qrData || !user) return;
    setCancelling(true);
    try {
      // Supabase ground truth: cancel_redemption_qr(p_qr_token text, p_user_id uuid)
      const { data } = await supabase.rpc('cancel_redemption_qr', {
        p_qr_token: qrData.code,
        p_user_id: user.id,
      });
      if (data?.success) {
        setUser({ ...user, enb_local_bal: (user.enb_local_bal || 0) + parseInt(enbAmount) });
        setQrData(null);
        setQrImageUrl('');
        setEnbAmount('');
        setSelectedOffer(null);
      } else {
        alert('Cancel failed: ' + (data?.error || 'Please try again'));
      }
    } catch (err: any) {
      console.error('Cancel QR error:', err?.message || err);
      alert('Cancel failed: ' + (err?.message || 'Please try again'));
    }
    setCancelling(false);
  };

  const handleShare = () => {
    if (!qrData) return;
    const biz = businesses.find(b => b.id === selectedBiz);
    const url = `https://eco-neighbor.vercel.app/scan?code=${qrData.code}`;
    const text = `ENB SWAP\nAmount: ${enbAmount} ENB\nBusiness: ${biz?.business_name}\nScan to SWAP: ${url}`;
    if (navigator.share) navigator.share({ title: 'ENB SWAP', text, url });
    else { navigator.clipboard.writeText(url); alert('SWAP link copied!'); }
  };

  const handleDownloadQR = () => {
    if (!qrImageUrl || !qrData) return;
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `ENB-QR-${qrData.code}.png`;
    link.click();
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timerColor = secondsLeft < 60 ? 'text-red-500' : 'text-enb-green';
  const discountOffers = offers.filter(o => o.category === 'discount');
  const swapOffers = offers.filter(o => o.category === 'swap');

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-[60vh] p-6 space-y-6 max-w-md mx-auto">
      <header className="flex items-center gap-4">
        <Link to="/wallet">
          <Button variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="w-5 h-5 text-enb-text-secondary" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">{l('wallet', 'qrTitle')}</h1>
          <p className="text-sm text-enb-text-secondary">Generate a one-time SWAP code</p>
        </div>
      </header>

      <div className="text-center">
        <p className="text-sm text-enb-text-secondary">Available balance</p>
        <p className="text-3xl font-bold text-enb-green">{(user.enb_local_bal ?? 0).toLocaleString()} ENB</p>
      </div>

      {!qrData ? (
        <div className="space-y-4">
          {/* Business selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">{l('wallet', 'qrSelectBusiness')}</label>
            <div className="relative">
              <select
                value={selectedBiz}
                onChange={e => setSelectedBiz(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-enb-teal appearance-none pr-10"
              >
                <option value="">Choose a partner business...</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.business_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Offers from selected business */}
          {selectedBiz && offers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">Select an Offer <span className="text-gray-400 font-normal">(optional)</span></label>

              {swapOffers.length > 0 && (
                <div>
                  <p className="text-xs text-enb-green font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Coins className="w-3 h-3" /> ENB Swap Items
                  </p>
                  <div className="space-y-1.5">
                    {swapOffers.map(offer => (
                      <button key={offer.id} onClick={() => setSelectedOffer(selectedOffer?.id === offer.id ? null : offer)}
                        className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${selectedOffer?.id === offer.id ? 'border-enb-green bg-enb-green/5' : 'border-gray-200 hover:border-enb-green/40'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{offer.item_name}</span>
                          <span className="font-bold text-enb-green">{offer.enb_cost?.toLocaleString()} ENB</span>
                        </div>
                        {offer.description && <p className="text-xs text-gray-500 mt-0.5">{offer.description}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {discountOffers.length > 0 && (
                <div>
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Discount Offers
                  </p>
                  <div className="space-y-1.5">
                    {discountOffers.map(offer => (
                      <div key={offer.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{offer.item_name}</span>
                          <span className="font-bold text-amber-700">{offer.discount_pct}% off</span>
                        </div>
                        {offer.description && <p className="text-xs text-gray-500 mt-0.5">{offer.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">Show your ENB member QR at checkout</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedBiz && offers.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No active offers from this business yet</p>
          )}

          {/* ENB amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">ENB Amount to Spend</label>
            <Input
              type="number"
              placeholder="e.g. 500"
              value={enbAmount}
              onChange={e => setEnbAmount(e.target.value)}
              min={1}
              max={user.enb_local_bal || 0}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={!selectedBiz || !enbAmount || loading}
            className="w-full bg-enb-green hover:bg-enb-green/90 text-white">
            {loading ? l('common', 'loading') : l('wallet', 'qrGenerateBtn')}
          </Button>

          <p className="text-xs text-center text-gray-400">
            ENB is reserved when QR is generated. <strong>Cancel anytime to get it back.</strong>
          </p>
        </div>
      ) : (
        <div className="space-y-4 flex flex-col items-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="flex flex-col items-center p-5 gap-3">
                {/* Real scannable QR code */}
                {qrImageUrl ? (
                  <div className="p-2 bg-white rounded-xl border-2 border-enb-green/20">
                    <img
                      src={qrImageUrl}
                      alt="SWAP QR Code"
                      className="w-[200px] h-[200px] block"
                    />
                  </div>
                ) : (
                  <div className="w-[200px] h-[200px] bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-enb-green border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                <div className="text-center">
                  <p className="text-lg font-bold text-enb-green">{enbAmount} ENB</p>
                  <p className="text-sm text-enb-text-secondary">→ {businesses.find(b => b.id === selectedBiz)?.business_name}</p>
                  {selectedOffer && (
                    <p className="text-xs text-enb-green mt-0.5">{selectedOffer.item_name}</p>
                  )}
                </div>

                <p className="text-xs text-gray-400 font-mono">{qrData.code}</p>
              </CardContent>
            </Card>
          </motion.div>

          <div className={`flex items-center gap-2 text-lg font-bold ${timerColor}`}>
            <Clock className="w-5 h-5" />
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} remaining
          </div>

          <p className="text-xs text-center text-gray-400">
            Business owner scans this QR with their phone camera. One-time use only.
          </p>

          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={handleShare} className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />Share
            </Button>
            <Button variant="outline" onClick={handleDownloadQR} disabled={!qrImageUrl} className="flex-1">
              <Download className="w-4 h-4 mr-2" />Save
            </Button>
          </div>

          <Button variant="outline" onClick={handleCancel} disabled={cancelling}
            className="w-full text-red-500 border-red-200 hover:bg-red-50">
            <X className="w-4 h-4 mr-2" />{cancelling ? 'Cancelling...' : 'Cancel & Refund'}
          </Button>

          <p className="text-xs text-center text-amber-600">
            Cancel returns {enbAmount} ENB to your wallet immediately.
          </p>
        </div>
      )}
    </div>
  );
}
