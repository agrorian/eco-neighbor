import { useState, useRef, useCallback } from 'react';
import React from 'react';
import Webcam from 'react-webcam';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';

export default function ScanRedemption() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const handleScan = useCallback(() => {
    // Simulate scan
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setScanned(true);
      setResult('success');
    }, 1500);
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setScanned(true);
      setResult(manualCode === '123456' ? 'success' : 'error');
    }, 1000);
  };

  if (scanned && result === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-enb-green/10 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle className="w-12 h-12 text-enb-green" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Redemption Confirmed!</h1>
          <p className="text-enb-text-secondary mt-2">
            <span className="font-bold text-enb-text-primary">15 ENB</span> deducted from <span className="font-bold text-enb-text-primary">@eco_warrior</span>
          </p>
        </div>
        <Button onClick={() => { setScanned(false); setResult(null); }} className="w-full bg-enb-green hover:bg-enb-green/90 text-white">
          Scan Another
        </Button>
        <Link to="/">
          <Button variant="ghost" className="text-enb-text-secondary">Return to Dashboard</Button>
        </Link>
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

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'environment' }}
          className="absolute inset-0 w-full h-full object-cover"
          disablePictureInPicture={true}
          forceScreenshotSourceSize={true}
          imageSmoothing={true}
          mirrored={false}
          onUserMedia={() => {}}
          onUserMediaError={() => {}}
          screenshotQuality={0.92}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none">
          <div className="w-full h-full border-2 border-white/50 relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-enb-green -mt-1 -ml-1" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-enb-green -mt-1 -mr-1" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-enb-green -mb-1 -ml-1" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-enb-green -mb-1 -mr-1" />
          </div>
        </div>

        {/* Scan Trigger (Simulated) */}
        <div className="absolute bottom-32 left-0 right-0 flex justify-center z-20">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleScan}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm"
          >
            <div className="w-12 h-12 rounded-full bg-white" />
          </motion.button>
        </div>
      </div>

      <div className="bg-white text-enb-text-primary p-6 rounded-t-3xl -mt-6 relative z-10">
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        
        <h3 className="font-bold text-center mb-4">Or enter code manually</h3>
        
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="text-center font-mono tracking-widest text-lg uppercase"
            maxLength={6}
          />
          <Button type="submit" disabled={manualCode.length < 6 || processing} className="bg-enb-teal hover:bg-enb-teal/90 text-white">
            {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
