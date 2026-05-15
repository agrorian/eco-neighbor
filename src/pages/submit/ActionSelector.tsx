import { motion } from 'motion/react';
import { Leaf, Recycle, Car, Apple, GraduationCap, AlertTriangle, Wrench, Heart, TreePine, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useT } from '@/contexts/LanguageContext';

interface ActionSelectorProps {
  onSelect: (action: string) => void;
}

// ── ENB DOCTRINE: Single source of truth for action display metadata ──────────
// ENB values here are display-only starting points.
// Actual ENB awarded is calculated in SubmitAction.tsx (canonical source).
// Carpool ENB is dynamic (base_rate × distance × passenger_mult × rating_mult)
// so it shows the per-km range rather than a fixed number.
interface ActionMeta {
  id: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  enb: number | null;       // null = dynamic (carpool)
  enbLabel?: string;        // override label when enb is dynamic
  rep: number;
}

const ACTION_META: ActionMeta[] = [
  { id: 'neighbourhood_cleanup', icon: Leaf,          color: 'text-enb-green',  bg: 'bg-enb-green/10', enb: 1000, rep: 500  },
  { id: 'recycling_dropoff',     icon: Recycle,       color: 'text-blue-500',   bg: 'bg-blue-50',      enb: 500,  rep: 200  },
  // ── Carpool: ENB is dynamic — base_rate × distance × passenger_mult × rating_mult ──
  // Bike 100/km, Rickshaw/Auto 120/km, Car 150/km, Van 200/km, Bus 300/km
  // Passenger multiplier: 1.0 / 1.3 / 1.6 / 2.0 / 2.5
  // Per-vehicle caps: Bike 3k, Rickshaw/Auto 4k, Car 5k, Van 10k, Bus 20k
  { id: 'carpool',               icon: Car,           color: 'text-teal-500',   bg: 'bg-teal-50',      enb: null, enbLabel: '100–300', rep: 150  },
  { id: 'food_sharing',          icon: Apple,         color: 'text-orange-500', bg: 'bg-orange-50',    enb: 800,  rep: 300  },
  { id: 'skill_workshop',        icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-50',    enb: 1500, rep: 1000 },
  { id: 'infrastructure_report', icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50',    enb: 300,  rep: 100  },
  { id: 'trade_job',             icon: Wrench,        color: 'text-gray-500',   bg: 'bg-gray-100',     enb: 1000, rep: 800  },
  { id: 'youth_mentoring',       icon: Heart,         color: 'text-pink-500',   bg: 'bg-pink-50',      enb: 2000, rep: 1500 },
  { id: 'tree_planting',         icon: TreePine,      color: 'text-enb-green',  bg: 'bg-enb-green/10', enb: 2000, rep: 1200 },
  { id: 'waste_reporting',       icon: Trash2,        color: 'text-red-500',    bg: 'bg-red-50',       enb: 500,  rep: 200  },
];

export default function ActionSelector({ onSelect }: ActionSelectorProps) {
  const { l } = useT();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-enb-text-primary mb-2">
        {l('submit', 'selectTitle')}
      </h2>
      <div className="grid gap-4">
        {ACTION_META.map((action, i) => {
          const title = l('actions', action.id as any);
          const desc  = l('actions', `desc_${action.id}` as any);
          // Determine ENB display label
          const enbDisplay = action.enb !== null
            ? `+${action.enb.toLocaleString()} ENB`
            : `${action.enbLabel} ENB/km`; // carpool: dynamic per km
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(action.id)}
              className="cursor-pointer"
            >
              <Card className="hover:border-enb-green/50 transition-colors border-gray-100 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.bg} ${action.color}`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-enb-text-primary">{title}</h3>
                      <p className="text-xs text-enb-text-secondary">{desc}</p>
                      <div className="mt-1 flex gap-2">
                        <span className="inline-flex items-center text-xs font-medium text-enb-green bg-enb-green/5 px-2 py-0.5 rounded-full">
                          {enbDisplay}
                        </span>
                        <span className="inline-flex items-center text-xs font-medium text-enb-gold bg-enb-gold/5 px-2 py-0.5 rounded-full">
                          +{action.rep} Rep
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
