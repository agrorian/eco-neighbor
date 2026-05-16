import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';

// ── DirectoryHub — visual landing for all directories ────────────────────────
// Visual-first: large emoji tiles, colour-coded, zero text-heavy descriptions.
// ENB users may be low-literacy — icons and colour do the communicating.

const DIRECTORIES = [
  {
    path: '/directory/business',
    emoji: '🏪',
    label: 'Business Directory',
    labelUr: 'کاروباری ڈائریکٹری',
    desc: 'Shops & partners that accept $ENB',
    descUr: 'دکانیں جو ENB قبول کرتی ہیں',
    bg: 'from-enb-green to-enb-teal',
    badge: 'SWAP here',
    badgeBg: 'bg-enb-gold text-white',
  },
  {
    path: '/directory/trades',
    emoji: '🔧',
    label: 'Trades Directory',
    labelUr: 'ہنرمند ڈائریکٹری',
    desc: 'Verified plumbers, electricians & more',
    descUr: 'تصدیق شدہ کاریگر',
    bg: 'from-enb-teal to-blue-600',
    badge: 'Hire verified',
    badgeBg: 'bg-white text-enb-teal',
  },
];

export default function DirectoryHub() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const isUrdu = user?.neighbourhood?.startsWith('PK') ?? false;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-enb-text-primary">
          {isUrdu ? 'ڈائریکٹری' : 'Directory'}
        </h1>
        <p className="text-sm text-enb-text-secondary mt-1">
          {isUrdu ? 'کیا تلاش کر رہے ہیں؟' : 'What are you looking for?'}
        </p>
      </div>

      {/* Visual directory tiles */}
      <div className="space-y-4">
        {DIRECTORIES.map(dir => (
          <button
            key={dir.path}
            onClick={() => navigate(dir.path)}
            className="w-full text-left"
          >
            <div className={`relative bg-gradient-to-br ${dir.bg} rounded-2xl p-6 shadow-lg overflow-hidden`}>
              {/* Background decoration */}
              <div className="absolute -right-6 -top-6 text-9xl opacity-10 select-none">
                {dir.emoji}
              </div>

              <div className="relative z-10 flex items-center gap-5">
                {/* Large emoji */}
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-5xl flex-shrink-0 shadow-inner">
                  {dir.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Badge */}
                  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${dir.badgeBg}`}>
                    {dir.badge}
                  </span>

                  {/* Label */}
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {isUrdu ? dir.labelUr : dir.label}
                  </h2>

                  {/* Description */}
                  <p className="text-white/80 text-sm mt-1">
                    {isUrdu ? dir.descUr : dir.desc}
                  </p>
                </div>

                {/* Arrow */}
                <div className="text-white/60 text-2xl flex-shrink-0">›</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Info strip */}
      <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-3xl">💡</span>
        <p className="text-sm text-enb-text-secondary leading-relaxed">
          {isUrdu
            ? 'کاروباروں میں ENB خرچ کریں۔ ہنرمندوں سے کام کروائیں اور ENB کمائیں۔'
            : 'Spend ENB at businesses. Hire verified tradespeople and earn ENB for community work.'}
        </p>
      </div>
    </div>
  );
}
