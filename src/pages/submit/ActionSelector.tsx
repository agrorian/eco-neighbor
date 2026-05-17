// src/pages/submit/ActionSelector.tsx
// ENB DOCTRINE — VISUAL-FIRST (locked 17 May 2026)
// Users are often low-literacy. Big emoji, color-coded cards, reward badges.
// Zero paragraph text on the cards. Title + rewards only.
// Pattern: TradeJobSelector emoji grid.

import { motion } from 'motion/react';
import { useT } from '@/contexts/LanguageContext';

interface ActionSelectorProps {
  onSelect: (action: string) => void;
}

// ── Single source of truth for action display metadata ─────────────────────
// ENB values are display-only. Canonical values live in SubmitAction.tsx.
// Carpool ENB is dynamic per km — shown as a range label.
interface ActionCard {
  id: string;
  emoji: string;
  labelEn: string;
  labelUr: string;
  enbDisplay: string;   // always shown as-is (includes units)
  rep: number;
  bg: string;           // card accent background
  badge: string;        // ENB badge color
}

const ACTIONS: ActionCard[] = [
  {
    id: 'neighbourhood_cleanup',
    emoji: '🧹',
    labelEn: 'Cleanup',
    labelUr: 'صفائی',
    enbDisplay: '+1,000 ENB',
    rep: 500,
    bg: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-800',
  },
  {
    id: 'recycling_dropoff',
    emoji: '♻️',
    labelEn: 'Recycling',
    labelUr: 'ری سائیکلنگ',
    enbDisplay: '+500 ENB',
    rep: 200,
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'carpool',
    emoji: '🚗',
    labelEn: 'Carpool',
    labelUr: 'کارپول',
    enbDisplay: '100–300/km',
    rep: 150,
    bg: 'bg-teal-50 border-teal-200',
    badge: 'bg-teal-100 text-teal-800',
  },
  {
    id: 'food_sharing',
    emoji: '🍱',
    labelEn: 'Food Sharing',
    labelUr: 'کھانا بانٹنا',
    enbDisplay: '+800 ENB',
    rep: 300,
    bg: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
  },
  {
    id: 'skill_workshop',
    emoji: '🎓',
    labelEn: 'Skill Workshop',
    labelUr: 'ہنر ورکشاپ',
    enbDisplay: '+1,500 ENB',
    rep: 1000,
    bg: 'bg-purple-50 border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
  },
  {
    id: 'infrastructure_report',
    emoji: '🚧',
    labelEn: 'Report Issue',
    labelUr: 'مسئلہ رپورٹ',
    enbDisplay: '+300 ENB',
    rep: 100,
    bg: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: 'trade_job',
    emoji: '🔧',
    labelEn: 'Trade Job',
    labelUr: 'ہنر کا کام',
    enbDisplay: '+1,000 ENB',
    rep: 800,
    bg: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-100 text-slate-800',
  },
  {
    id: 'youth_mentoring',
    emoji: '🤝',
    labelEn: 'Mentoring',
    labelUr: 'رہنمائی',
    enbDisplay: '+2,000 ENB',
    rep: 1500,
    bg: 'bg-pink-50 border-pink-200',
    badge: 'bg-pink-100 text-pink-800',
  },
  {
    id: 'tree_planting',
    emoji: '🌳',
    labelEn: 'Tree Planting',
    labelUr: 'درخت لگانا',
    enbDisplay: '+2,000 ENB',
    rep: 1200,
    bg: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-800',
  },
  {
    id: 'waste_reporting',
    emoji: '🗑️',
    labelEn: 'Waste Report',
    labelUr: 'کچرہ رپورٹ',
    enbDisplay: '+500 ENB',
    rep: 200,
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
  },
];

export default function ActionSelector({ onSelect }: ActionSelectorProps) {
  const { l, lang } = useT();
  const isUrdu = lang === 'ur';

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="text-center pt-1 pb-2">
        <h2 className="text-xl font-bold text-enb-text-primary">
          {isUrdu ? 'کام منتخب کریں' : 'Choose your action'}
        </h2>
        <p className="text-sm text-enb-text-secondary mt-0.5">
          {isUrdu ? 'آپ کی محنت کی قدر ہے' : 'Your neighborhood work has value'}
        </p>
      </div>

      {/* 2-column emoji card grid */}
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action, i) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(action.id)}
            className={`relative flex flex-col items-center justify-between gap-2
              rounded-2xl border p-4 text-center transition-all
              hover:shadow-md active:scale-95 cursor-pointer
              ${action.bg}`}
          >
            {/* Big emoji */}
            <span className="text-4xl leading-none select-none" role="img" aria-hidden="true">
              {action.emoji}
            </span>

            {/* Action name */}
            <span className="font-bold text-sm text-enb-text-primary leading-tight">
              {isUrdu ? action.labelUr : action.labelEn}
            </span>

            {/* Reward badges row */}
            <div className="flex flex-col gap-1 w-full">
              <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${action.badge}`}>
                {action.enbDisplay}
              </span>
              <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-amber-100 text-amber-800">
                +{action.rep.toLocaleString()} Rep
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Bottom note — simple, low-literacy friendly */}
      <div className="text-center pt-2">
        <p className="text-xs text-enb-text-secondary">
          {isUrdu
            ? '📸 ہر کام کے لیے تصویر ضروری ہے'
            : '📸 Photo required for every action'}
        </p>
      </div>
    </div>
  );
}
