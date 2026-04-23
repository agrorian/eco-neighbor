import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getTimeUntilUnlock } from '@/lib/beforeAfter';

interface CountdownTimerProps {
  afterUnlocksAt: string;
  onUnlocked?: () => void;
}

export default function CountdownTimer({ afterUnlocksAt, onUnlocked }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => getTimeUntilUnlock(afterUnlocksAt));

  useEffect(() => {
    if (remaining.totalMs <= 0) {
      onUnlocked?.();
      return;
    }
    const interval = setInterval(() => {
      const r = getTimeUntilUnlock(afterUnlocksAt);
      setRemaining(r);
      if (r.totalMs <= 0) {
        clearInterval(interval);
        onUnlocked?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [afterUnlocksAt]);

  if (remaining.totalMs <= 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="bg-enb-gold/5 border border-enb-gold/20 rounded-2xl p-5 text-center space-y-3">
      <div className="flex items-center justify-center gap-2 text-enb-gold font-semibold text-sm">
        <Clock className="w-4 h-4" />
        After Submission Unlocks In
      </div>
      <div className="flex items-center justify-center gap-3">
        <TimeBlock value={pad(remaining.hrs)} label="hrs" />
        <span className="text-2xl font-bold text-enb-text-primary opacity-40 -mt-3">:</span>
        <TimeBlock value={pad(remaining.mins)} label="min" />
        <span className="text-2xl font-bold text-enb-text-primary opacity-40 -mt-3">:</span>
        <TimeBlock value={pad(remaining.secs)} label="sec" />
      </div>
      <p className="text-xs text-enb-text-secondary">
        Return here once the timer finishes to submit your After photos.
      </p>
    </div>
  );
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-14 bg-white border border-enb-gold/20 rounded-xl flex items-center justify-center shadow-sm">
        <span className="text-2xl font-bold text-enb-text-primary font-mono">{value}</span>
      </div>
      <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">{label}</span>
    </div>
  );
}
