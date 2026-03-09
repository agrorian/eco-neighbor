import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Share2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/store/user';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Business {
  id: string;
  business_name: string;
  discount_offer: string;
}

export default function GenerateRedemptionQR() {
  const { user, setUser } = useUserStore();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState('');
  const [enbAmount, setEnbAmount] = useState('');
  const [qrData, setQrData] = useState<{ code: string; expiresAt: Date } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('business_partners')
      .select('id, business_name, discount_offer')
      .eq('is_active', true)
      .then(({ data }) => { if (data) setBusinesses(data); });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!qrData) return;
    const interval = setInterval(() => {
      const secs = Math.max(0, Math.round((qrData.expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(secs);
      if (secs === 0) setQrData(null);
    }, 1000);
    return () => clearInterval(interval);
  }, [qrData]);

  const handleGenerate = async () => {
    if (!user || !selectedBiz || !enbAmount) return;
    const amount = parseInt(enbAmount);
    if (isNaN(amount) || amount <= 0) { setError('Enter a valid ENB amount'); return; }
    if (amount > (user.enb_local_bal || 0)) { setError('Insufficient ENB balance'); return; }

    setLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('create_redemption_qr', {
        p_user_id: user.id,
        p_business_id: selectedBiz,
        p_enb_amount: amount,
      });

      if (rpcError) throw rpcError;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate QR');

      // Update local balance
      setUser({ ...user, enb_local_bal: (user.enb_local_bal || 0) - amount });

      setQrData({ code: data.qr_code, expiresAt: new Date(data.expires_at) });
      setSecondsLeft(600);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!qrData) return;
    const biz = businesses.find(b => b.id === selectedBiz);
    const text = `ENB Redemption Code: ${qrData.code}\nAmount: ${enbAmount} ENB\nBusiness: ${biz?.business_name}\nExpires: ${qrData.expiresAt.toLocaleTimeString()}`;
    if (navigator.share) {
      navigator.share({ title: 'ENB Redemption QR', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Code copied to clipboard!');
    }
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timerColor = secondsLeft < 60 ? 'text-red-500' : 'text-enb-green';

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
          <h1 className="text-xl font-bold text-enb-text-primary">Spend ENB</h1>
          <p className="text-sm text-enb-text-secondary">Generate a one-time redemption code</p>
        </div>
      </header>

      <div className="text-center">
        <p className="text-sm text-enb-text-secondary">Available balance</p>
        <p className="text-3xl font-bold text-enb-green">{(user.enb_local_bal ?? 0).toLocaleString()} ENB</p>
      </div>

      {!qrData ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Select Business</label>
            <select
              value={selectedBiz}
              onChange={e => setSelectedBiz(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-enb-teal"
            >
              <option value="">Choose a partner business...</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.business_name} — {b.discount_offer}</option>
              ))}
            </select>
          </div>

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
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedBiz || !enbAmount || loading}
            className="w-full bg-enb-green hover:bg-enb-green/90 text-white"
          >
            {loading ? 'Generating...' : 'Generate QR Code'}
          </Button>

          <p className="text-xs text-center text-gray-400">
            ENB is reserved immediately. QR expires in 10 minutes if not scanned.
          </p>
        </div>
      ) : (
        <div className="space-y-4 flex flex-col items-center">
          {/* QR Code display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <Card className="bg-white border-gray-100 shadow-lg w-64 h-64 flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center p-4">
                {/* QR code as text code — replace with qrcode.react when installed */}
                <div className="bg-gray-100 rounded-xl p-4 text-center w-full">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Redemption Code</p>
                  <p className="font-mono font-bold text-lg text-enb-text-primary break-all">{qrData.code.slice(0, 8).toUpperCase()}</p>
                </div>
                <p className="text-sm text-enb-text-secondary mt-3 font-medium">
                  {enbAmount} ENB → {businesses.find(b => b.id === selectedBiz)?.business_name}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Countdown */}
          <div className={`flex items-center gap-2 text-lg font-bold ${timerColor}`}>
            <Clock className="w-5 h-5" />
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} remaining
          </div>

          <p className="text-xs text-center text-gray-400">
            Show this code to the business owner. It can only be used once.
          </p>

          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={handleShare} className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share Code
            </Button>
            <Button variant="outline" onClick={() => { setQrData(null); setEnbAmount(''); }} className="flex-1 text-red-500 border-red-100">
              <RefreshCw className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
