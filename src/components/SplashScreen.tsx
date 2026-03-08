import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 20);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500); // Slightly longer than 2s to allow animation to finish

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-enb-surface">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="w-24 h-24 bg-enb-green rounded-full flex items-center justify-center shadow-xl shadow-enb-green/20">
          <Leaf className="w-12 h-12 text-white animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-enb-gold rounded-full flex items-center justify-center border-4 border-enb-surface">
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-2xl font-bold text-enb-text-primary tracking-tight"
      >
        Eco-Neighbor
      </motion.h1>

      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-2 text-enb-text-secondary font-medium"
      >
        Your Good Work Has Value
      </motion.p>

      <div className="mt-12 w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-enb-green rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
