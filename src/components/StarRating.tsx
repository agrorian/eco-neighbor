import { useState } from 'react';
import { Star } from 'lucide-react';

// ── StarRating — shared component used across all rating touchpoints ──────────
// Interactive mode: pass onChange. Display-only mode: omit onChange.
// Never import Star inline in other components — use this everywhere.

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

interface StarRatingProps {
  value: number;                        // 0 = nothing selected/no rating
  onChange?: (v: number) => void;       // omit for display-only
  size?: 'sm' | 'md' | 'lg';           // sm=list rows, md=interactive form, lg=profile hero
  showLabel?: boolean;                  // show Poor/Fair/Good/Great/Excellent text
  showCount?: number;                   // show "(n ratings)" next to stars in display mode
  disabled?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = 'md',
  showLabel = false,
  showCount,
  disabled = false,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const isInteractive = !!onChange && !disabled;

  const sizeCls: Record<string, string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-7 h-7',
  };

  const gapCls: Record<string, string> = {
    sm: 'gap-0.5',
    md: 'gap-1.5',
    lg: 'gap-1',
  };

  const active = hover || value;

  return (
    <div className="flex flex-col items-start gap-1">
      <div className={`flex items-center ${gapCls[size]}`}>
        {[1, 2, 3, 4, 5].map(s => {
          const filled = s <= active;
          return isInteractive ? (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange!(s)}
              className="transition-transform hover:scale-110 focus:outline-none"
              aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
            >
              <Star
                className={`${sizeCls[size]} transition-colors ${
                  filled ? 'text-enb-gold fill-enb-gold' : 'text-gray-200'
                }`}
              />
            </button>
          ) : (
            <Star
              key={s}
              className={`${sizeCls[size]} ${
                filled ? 'text-enb-gold fill-enb-gold' : 'text-gray-200'
              }`}
            />
          );
        })}
        {showCount !== undefined && showCount > 0 && (
          <span className="text-xs text-gray-400 ml-1">({showCount})</span>
        )}
      </div>

      {showLabel && value > 0 && (
        <span className="text-xs text-gray-400">{LABELS[value]}</span>
      )}
    </div>
  );
}
