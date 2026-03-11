import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, CheckCircle, AlertCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface RedemptionResult {
  success: boolean;
  enb_amount?: number;
  member_name?: string;
  error?: string;
}

export default function ScanRedemption() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');

  const processCode = async (code: string) => {
    if (!user || !code.trim()) return;
    setProcessing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc('confirm_redemption', {
        p_qr_token: code.trim().toUpperCase(),
        p_business_id: user.id,
      });
      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, error: err.message || 'Redemption failed. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCode(manualCode);
  };

  const openCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setCameraError('Camera not available. Please enter code manually.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const resetScan = () => {
    setResult(null);
    setManualCode('');
    stopCamera();
  };

  // Success screen
  if (result?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-enb-green/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-enb-green" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Redemption Confirmed!</h1>
          {result.member_name && (
            <p className="text-enb-text-secondary mt-1">Member: <span className="font-bold text-enb-text-primary">{result.member_name}</span></p>
          )}
          {result.enb_amount && (
            <p className="text-enb-text-secondary mt-1">
              <span className="font-bold text-enb-green">{result.enb_amount.toLocaleString()} ENB</span> accepted
              <span className="text-xs text-gray-400 ml-1">(2% burn applied)</span>
            </p>
          )}
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <Button onClick={resetScan} className="flex-1 bg-enb-green text-white">
            <RefreshCw className="w-4 h-4 mr-2" /> Scan Another
          </Button>
          <Link to="/" className="flex-1">
            <Button variant="outline" className="w-full">Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-4 flex items-center justify-between bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/10">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-bold text-lg">Scan to Redeem</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden pt-16">
        {cameraActive ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/50 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-enb-green -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-enb-green -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-enb-green -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-enb-green -mb-1 -mr-1" />
              </div>
            </div>
            <Button onClick={stopCamera} className="absolute top-20 right-4 bg-white/20 text-white hover:bg-white/30 text-sm">Cancel</Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 p-8">
            <Camera className="w-24 h-24 text-white/30" />
            <p className="text-white/60 text-center text-sm">Scan member's QR code or enter code below</p>
            <Button onClick={openCamera} className="bg-enb-green hover:bg-enb-green/90 text-white">
              <Camera className="w-4 h-4 mr-2" /> Open Camera
            </Button>
            {cameraError && <p className="text-yellow-400 text-sm text-center">{cameraError}</p>}
          </div>
        )}
      </div>

      {/* Manual entry + result */}
      <div className="bg-white text-enb-text-primary p-6 rounded-t-3xl relative z-10">
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* Error result */}
        {result && !result.success && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700 text-sm">Redemption Failed</p>
                <p className="text-red-600 text-xs mt-1">{result.error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <h3 className="font-bold text-center mb-4 text-sm text-gray-500 uppercase tracking-wider">Enter Code Manually</h3>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="Enter redemption code"
            className="text-center font-mono tracking-widest text-lg uppercase"
            maxLength={12}
          />
          <Button type="submit" disabled={manualCode.length < 4 || processing}
            className="bg-enb-teal hover:bg-enb-teal/90 text-white px-4">
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          </Button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">QR codes expire after 10 minutes</p>
      </div>
    </div>
  );
}
