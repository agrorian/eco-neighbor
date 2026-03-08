import { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Wallet } from 'lucide-react';

export default function ConnectWallet() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleWalletChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWalletAddress(value);
    // Simple validation for Solana address format (base58, length check)
    setIsValid(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value));
  };

  const handleConnect = () => {
    // Simulate wallet connection
    navigate('/onboarding/tutorial');
  };

  const handleSkip = () => {
    navigate('/onboarding/tutorial');
  };

  return (
    <div className="min-h-screen bg-enb-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-enb-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-enb-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg relative z-10">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-2xl font-bold text-enb-text-primary ml-2">Connect Wallet</h2>
        </div>

        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-enb-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-enb-gold" />
            </div>
            <p className="text-enb-text-secondary text-sm">
              Connect your Solana wallet to bridge tokens and access advanced features.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Solana Wallet Address</label>
            <Input
              type="text"
              placeholder="Enter your Phantom wallet address"
              value={walletAddress}
              onChange={handleWalletChange}
              className="font-mono text-sm"
            />
            {walletAddress && !isValid && (
              <p className="text-xs text-red-500 mt-1">Invalid Solana address format.</p>
            )}
          </div>

          <Button onClick={handleConnect} className="w-full mt-4" disabled={!isValid}>
            Connect Wallet
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="text-center mt-4">
            <button onClick={handleSkip} className="text-sm text-gray-500 hover:text-enb-green hover:underline">
              I don't have a wallet yet (Skip)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
