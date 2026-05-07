import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Camera, CheckCircle, AlertCircle,
  ArrowRight, Loader2, RefreshCw, CameraOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

interface RedemptionResult {
  success: boolean;
  enb_spent?: number;
  enb_amount?: number;
  member_name?: string;
  enb_to_crp?: number;       // 80% returned to CRP
  enb_global_business?: number; // 3.3% to business as ENB.GLOBAL
  enb_to_treasury?: number;  // 6.7% to community treasury
  error?: string;
}

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable';

export default function ScanRedemption() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUserStore();
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const hasScannedRef = useRef(false);

  // Auto-process when arriving via QR scan URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setManualCode(code);
      processCode(code);
    }
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const processCode = async (code: string) => {
    if (!user || !code.trim()) return;
    setProcessing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc('confirm_redemption', {
        p_qr_code: code.trim(),
      });
      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, error: err.message || 'SWAP failed. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCode(manualCode);
  };

  const openCamera = async () => {
    setCameraState('requesting');
    hasScannedRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unavailable');
      return;
    }

    // Check permission state if API available
    if (navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (status.state === 'denied') {
          setCameraState('denied');
          return;
        }
      } catch { /* not supported — proceed */ }
    }

    // 8-second safety timeout
    const timeout = setTimeout(() => {
      setCameraState('unavailable');
    }, 8000);

    try {
      const codeReader = new BrowserQRCodeReader();

      if (!videoRef.current) {
        clearTimeout(timeout);
        setCameraState('unavailable');
        return;
      }

      // Start continuous QR decode from camera
      const controls = await codeReader.decodeFromVideoDevice(
        undefined, // default camera (rear on mobile)
        videoRef.current,
        (result, error) => {
          if (result && !hasScannedRef.current) {
            hasScannedRef.current = true;
            const scannedText = result.getText();

            // Extract code from full URL if scanned as URL
            let code = scannedText;
            try {
              const url = new URL(scannedText);
              const param = url.searchParams.get('code');
              if (param) code = param;
            } catch {
              // not a URL — use raw text
            }

            stopCamera();
            setManualCode(code);
            processCode(code);
          }
          if (error && !error.message?.includes('No MultiFormat')) {
            console.debug('QR scan frame:', error.message);
          }
        }
      );

      clearTimeout(timeout);
      scannerControlsRef.current = controls;
      setCameraState('active');

    } catch (err: any) {
      clearTimeout(timeout);
      console.error('Camera error:', err?.name, err?.message);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraState('denied');
      } else {
        setCameraState('unavailable');
      }
    }
  };

  const stopCamera = () => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setCameraState('idle');
  };

  const resetScan = () => {
    setResult(null);
    setManualCode('');
    hasScannedRef.current = false;
    stopCamera();
  };

  const renderCameraError = () => {
    const isDenied = cameraState === 'denied';
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <CameraOff className="w-16 h-16 text-amber-400" />
        <p className="text-white font-semibold">
          {isDenied ? 'Camera Permission Denied' : 'Camera Not Available'}
        </p>
        <p className="text-white/60 text-sm">
          {isDenied
            ? 'Please allow camera access in your browser settings, then try again.'
            : 'Your device or browser does not support camera access on this page.'}
        </p>
        {isDenied && (
          <p className="text-white/40 text-xs px-4">
            Tap the 🔒 lock icon in the address bar → Site permissions → Camera → Allow → Refresh
          </p>
        )}
        <Button
          onClick={() => setCameraState('idle')}
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10 mt-2"
        >
          Use Manual Code Instead
        </Button>
      </div>
    );
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (result?.success) {
    const totalSpent = result.enb_spent ?? result.enb_amount ?? 0;
    // Calculate v6.2 split if RPC doesn't return breakdowns yet
    const toCRP = result.enb_to_crp ?? Math.round(totalSpent * 0.80);
    const toBusinessGlobal = result.enb_global_business ?? +(totalSpent * 0.033).toFixed(2);
    const toTreasury = result.enb_to_treasury ?? +(totalSpent * 0.067).toFixed(2);
    const toOpsFund = +(totalSpent * 0.10).toFixed(2);

    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-enb-green/10 rounded-full flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-enb-green" />
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">SWAP Confirmed!</h1>
          {result.member_name && (
            <p className="text-enb-text-secondary mt-1">
              Member: <span className="font-bold text-enb-text-primary">{result.member_name}</span>
            </p>
          )}
          {totalSpent > 0 && (
            <p className="text-enb-text-secondary mt-1">
              <span className="font-bold text-enb-green">{totalSpent.toLocaleString()} ENB.LOCAL</span>{' '}accepted
            </p>
          )}
        </div>

        {/* v6.2 SWAP breakdown */}
        {totalSpent > 0 && (
          <div className="w-full max-w-xs bg-enb-green/5 border border-enb-green/15 rounded-2xl px-5 py-4 space-y-2 text-left">
            <p className="text-xs font-bold text-enb-green text-center mb-2 uppercase tracking-wider">How this SWAP was distributed</p>

            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-enb-text-primary">Community Rewards Pool</p>
                <p className="text-xs text-gray-400">Sustains future civic rewards</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-enb-green">{toCRP.toLocaleString()}</p>
                <p className="text-xs text-gray-400">80%</p>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-enb-text-primary">Your ENB.GLOBAL Earning</p>
                <p className="text-xs text-gray-400">Credited to your wallet</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-amber-600">{toBusinessGlobal.toLocaleString()}</p>
                <p className="text-xs text-gray-400">3.3%</p>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <div>
                <p className="text-sm font-medium text-enb-text-primary">Community Treasury</p>
                <p className="text-xs text-gray-400">Stability, liquidity & reserve funds</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-500">{toTreasury.toLocaleString()}</p>
                <p className="text-xs text-gray-400">6.7%</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-enb-text-primary">ENB Operations Fund</p>
                <p className="text-sm font-bold text-amber-600">{toOpsFund.toLocaleString()}</p>
                <p className="text-xs text-gray-400">10%</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center pt-1">
              No value destroyed — every ENB recycled for the community
            </p>
          </div>
        )}

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

  // ── Main scan screen ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-4 flex items-center justify-between bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { stopCamera(); navigate(-1); }}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-bold text-lg">Scan to SWAP</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden pt-16">

        {/* Processing spinner */}
        {processing && (
          <div className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="w-16 h-16 text-enb-green animate-spin" />
            <p className="text-white/80 text-center">Processing SWAP...</p>
          </div>
        )}

        {/* Requesting permission */}
        {!processing && cameraState === 'requesting' && (
          <div className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="w-12 h-12 text-white/60 animate-spin" />
            <p className="text-white/60 text-sm">Requesting camera access...</p>
          </div>
        )}

        {/* Error states */}
        {!processing && (cameraState === 'denied' || cameraState === 'unavailable') && renderCameraError()}

        {/* Active camera + viewfinder — video always rendered so ref is available */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${cameraState === 'active' && !processing ? 'block' : 'hidden'}`}
        />
        {!processing && cameraState === 'active' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-enb-green" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-enb-green" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-enb-green" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-enb-green" />
                <div className="absolute inset-x-2 h-0.5 bg-enb-green/80 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
            <p className="absolute bottom-48 left-0 right-0 text-center text-white/60 text-sm px-8">
              Point camera at the member's QR code
            </p>
            <Button
              onClick={stopCamera}
              className="absolute top-20 right-4 bg-white/20 text-white hover:bg-white/30 text-sm"
            >
              Cancel
            </Button>
          </>
        )}

        {/* Idle */}
        {!processing && cameraState === 'idle' && (
          <div className="flex flex-col items-center gap-4 p-8">
            <Camera className="w-24 h-24 text-white/30" />
            <p className="text-white/60 text-center text-sm">
              Scan member's QR code or enter code below
            </p>
            <Button onClick={openCamera} className="bg-enb-green hover:bg-enb-green/90 text-white">
              <Camera className="w-4 h-4 mr-2" /> Open Camera
            </Button>
          </div>
        )}
      </div>

      {/* Manual entry panel */}
      <div className="bg-white text-enb-text-primary p-6 rounded-t-3xl relative z-10">
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {result && !result.success && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700 text-sm">SWAP Failed</p>
                <p className="text-red-600 text-xs mt-1">{result.error}</p>
                <Button onClick={resetScan} variant="ghost" size="sm" className="text-red-600 mt-2 p-0 h-auto">
                  Try again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <h3 className="font-bold text-center mb-4 text-sm text-gray-500 uppercase tracking-wider">
          Enter Code Manually
        </h3>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter SWAP code"
            className="text-center font-mono tracking-widest text-sm"
            maxLength={36}
          />
          <Button
            type="submit"
            disabled={manualCode.length < 4 || processing}
            className="bg-enb-teal hover:bg-enb-teal/90 text-white px-4"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          </Button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">QR codes expire after 10 minutes</p>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
      `}</style>
    </div>
  );
}
