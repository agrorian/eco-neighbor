import { useT } from '@/contexts/LanguageContext';

// ── Trade type definitions ────────────────────────────────────────────────────
// Each trade has:
//   - id: matches the options in ActionForm trade_type field
//   - en / ur: labels in both languages
//   - emoji: universal visual identifier (no reading required)
//   - description_en / description_ur: what this trade does
//   - beforeAfter: true = before/after comparison, false = single evidence photo
//   - beforeHint / afterHint: visual instruction text per language
//   - beforeIllustration / afterIllustration: emoji scene showing what to photograph

export interface TradeType {
  id: string;
  en: string;
  ur: string;
  emoji: string;
  description_en: string;
  description_ur: string;
  beforeAfter: boolean;
  beforeHint_en: string;
  beforeHint_ur: string;
  afterHint_en: string;
  afterHint_ur: string;
  beforeScene: string;   // emoji illustration of the BEFORE state
  afterScene: string;    // emoji illustration of the AFTER state
}

export const TRADE_TYPES: TradeType[] = [
  {
    id: 'Plumbing',
    en: 'Plumber',
    ur: 'پلمبر',
    emoji: '🔧',
    description_en: 'Pipes, taps, drains, water supply',
    description_ur: 'پائپ، نل، نالی، پانی کی سپلائی',
    beforeAfter: true,
    beforeHint_en: 'Take a photo of the broken pipe, leaking tap, or blocked drain BEFORE you fix it',
    beforeHint_ur: 'مرمت سے پہلے ٹوٹے پائپ، ٹپکتے نل یا بند نالی کی تصویر لیں',
    afterHint_en: 'Take a photo of the fixed pipe, tap, or drain AFTER your work is complete',
    afterHint_ur: 'کام مکمل ہونے کے بعد ٹھیک شدہ پائپ، نل یا نالی کی تصویر لیں',
    beforeScene: '💧🔩❌',
    afterScene: '✅🔧💧',
  },
  {
    id: 'Electrical',
    en: 'Electrician',
    ur: 'الیکٹریشن',
    emoji: '⚡',
    description_en: 'Wiring, fans, lights, switches, sockets',
    description_ur: 'وائرنگ، پنکھے، بلب، سوئچ، ساکٹ',
    beforeAfter: false,
    beforeHint_en: '',
    beforeHint_ur: '',
    afterHint_en: 'Take a photo of your completed electrical work — show the wiring, switch, fan, or light that you fixed or installed. If the customer is present, include them in the photo.',
    afterHint_ur: 'مکمل کام کی تصویر لیں — ٹھیک شدہ تار، سوئچ، پنکھا یا بلب دکھائیں۔ اگر گاہک موجود ہو تو اسے بھی تصویر میں شامل کریں۔',
    beforeScene: '',
    afterScene: '⚡✅👷',
  },
  {
    id: 'Carpentry / woodwork',
    en: 'Carpenter',
    ur: 'بڑھئی',
    emoji: '🪵',
    description_en: 'Doors, windows, furniture, wood repairs',
    description_ur: 'دروازے، کھڑکیاں، فرنیچر، لکڑی کی مرمت',
    beforeAfter: true,
    beforeHint_en: 'Take a photo of the broken door, window, or furniture BEFORE you start work',
    beforeHint_ur: 'کام شروع کرنے سے پہلے ٹوٹے دروازے، کھڑکی یا فرنیچر کی تصویر لیں',
    afterHint_en: 'Take a photo of the repaired or installed item AFTER your work is complete',
    afterHint_ur: 'کام مکمل ہونے کے بعد مرمت شدہ یا نصب کردہ چیز کی تصویر لیں',
    beforeScene: '🚪❌🔨',
    afterScene: '🚪✅🪵',
  },
  {
    id: 'Masonry / construction',
    en: 'Mason',
    ur: 'مستری',
    emoji: '🧱',
    description_en: 'Walls, floors, tiles, plastering, brickwork',
    description_ur: 'دیواریں، فرش، ٹائل، پلستر، اینٹوں کا کام',
    beforeAfter: true,
    beforeHint_en: 'Take a photo of the damaged wall, floor, or area BEFORE you start work',
    beforeHint_ur: 'کام شروع کرنے سے پہلے خراب دیوار، فرش یا جگہ کی تصویر لیں',
    afterHint_en: 'Take a photo of the completed masonry work AFTER you finish',
    afterHint_ur: 'کام مکمل ہونے کے بعد تعمیراتی کام کی تصویر لیں',
    beforeScene: '🧱❌🏚️',
    afterScene: '🧱✅🏠',
  },
  {
    id: 'Painting / decorating',
    en: 'Painter',
    ur: 'رنگ ساز',
    emoji: '🖌️',
    description_en: 'Walls, doors, gates, surfaces',
    description_ur: 'دیواریں، دروازے، گیٹ، سطحیں',
    beforeAfter: true,
    beforeHint_en: 'Take a photo of the unpainted or damaged surface BEFORE you start painting',
    beforeHint_ur: 'رنگ کرنے سے پہلے بے رنگ یا خراب سطح کی تصویر لیں',
    afterHint_en: 'Take a photo of the freshly painted surface AFTER you finish',
    afterHint_ur: 'کام مکمل ہونے کے بعد تازہ رنگ کی ہوئی سطح کی تصویر لیں',
    beforeScene: '🏚️⬜❌',
    afterScene: '🏠🎨✅',
  },
  {
    id: 'Welding / metalwork',
    en: 'Welder',
    ur: 'ویلڈر',
    emoji: '🔩',
    description_en: 'Gates, grilles, metal repairs, fabrication',
    description_ur: 'گیٹ، جالی، دھات کی مرمت، فیبریکیشن',
    beforeAfter: true,
    beforeHint_en: 'Take a photo of the broken gate, grille, or metal item BEFORE you start work',
    beforeHint_ur: 'کام شروع کرنے سے پہلے ٹوٹے گیٹ، جالی یا دھاتی چیز کی تصویر لیں',
    afterHint_en: 'Take a photo of the completed metalwork AFTER you finish welding or fabricating',
    afterHint_ur: 'ویلڈنگ یا فیبریکیشن مکمل ہونے کے بعد کام کی تصویر لیں',
    beforeScene: '🔩❌🏚️',
    afterScene: '🔩✅🏠',
  },
  {
    id: 'Auto repair',
    en: 'Auto Mechanic',
    ur: 'مکینک',
    emoji: '🚗',
    description_en: 'Cars, bikes, rickshaws, engines, tyres',
    description_ur: 'گاڑی، موٹر سائیکل، رکشہ، انجن، ٹائر',
    beforeAfter: false,
    beforeHint_en: '',
    beforeHint_ur: '',
    afterHint_en: 'Take a photo of the repaired vehicle or part. Show the engine, tyre, or component that was fixed. Include the vehicle and your tools if possible.',
    afterHint_ur: 'مرمت شدہ گاڑی یا پرزے کی تصویر لیں۔ ٹھیک شدہ انجن، ٹائر یا حصہ دکھائیں۔ ممکن ہو تو گاڑی اور اوزار بھی دکھائیں۔',
    beforeScene: '',
    afterScene: '🚗🔧✅',
  },
  {
    id: 'Appliance repair',
    en: 'Appliance Repair',
    ur: 'آلات کی مرمت',
    emoji: '📺',
    description_en: 'TV, fridge, AC, washing machine, motor',
    description_ur: 'ٹی وی، فریج، اے سی، واشنگ مشین، موٹر',
    beforeAfter: false,
    beforeHint_en: '',
    beforeHint_ur: '',
    afterHint_en: 'Take a photo of the repaired appliance. Show the inside or the component you fixed. If the customer is present, include them to confirm the work was done.',
    afterHint_ur: 'مرمت شدہ آلے کی تصویر لیں۔ اندرونی حصہ یا جو پرزہ ٹھیک کیا وہ دکھائیں۔ اگر گاہک موجود ہو تو اسے بھی شامل کریں۔',
    beforeScene: '',
    afterScene: '📺🔧✅',
  },
  {
    id: 'Other trade',
    en: 'Other Trade',
    ur: 'دیگر ہنر',
    emoji: '🛠️',
    description_en: 'Any other skilled trade or repair work',
    description_ur: 'کوئی بھی ہنر مندانہ کام یا مرمت',
    beforeAfter: false,
    beforeHint_en: '',
    beforeHint_ur: '',
    afterHint_en: 'Take a photo clearly showing the trade work you completed. Include your tools and the result of your work.',
    afterHint_ur: 'اپنے مکمل کردہ کام کی واضح تصویر لیں۔ اوزار اور کام کا نتیجہ دکھائیں۔',
    beforeScene: '',
    afterScene: '🛠️✅',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
interface TradeJobSelectorProps {
  selected: string | null;
  onSelect: (trade: TradeType) => void;
}

export default function TradeJobSelector({ selected, onSelect }: TradeJobSelectorProps) {
  const { isUrdu } = useT();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className={`text-lg font-bold text-enb-text-primary ${isUrdu ? 'font-urdu text-xl' : ''}`}>
          {isUrdu ? 'اپنا ہنر منتخب کریں' : 'Select Your Trade'}
        </h2>
        <p className={`text-sm text-enb-text-secondary ${isUrdu ? 'font-urdu' : ''}`}>
          {isUrdu ? 'نیچے دی گئی تصویروں میں سے اپنا کام چنیں' : 'Tap the image that matches your work'}
        </p>
      </div>

      {/* Trade grid — 3 columns on mobile */}
      <div className="grid grid-cols-3 gap-3">
        {TRADE_TYPES.map((trade) => {
          const isSelected = selected === trade.id;
          return (
            <button
              key={trade.id}
              onClick={() => onSelect(trade)}
              className={`
                flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2
                transition-all duration-200 active:scale-95
                ${isSelected
                  ? 'border-enb-gold bg-enb-gold/10 shadow-lg shadow-enb-gold/20'
                  : 'border-gray-200 bg-white hover:border-enb-green/40 hover:bg-enb-green/5'}
              `}
            >
              {/* Emoji icon — large, universally recognisable */}
              <span className="text-4xl leading-none" role="img" aria-label={trade.en}>
                {trade.emoji}
              </span>

              {/* Trade name in current language */}
              <span className={`
                text-center font-semibold leading-tight
                ${isUrdu ? 'font-urdu text-sm' : 'text-xs'}
                ${isSelected ? 'text-enb-gold-dark' : 'text-enb-text-primary'}
              `}>
                {isUrdu ? trade.ur : trade.en}
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <span className="text-enb-gold text-xs font-bold">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Visual Before/After guide — shows after trade is selected */}
      {selected && (() => {
        const trade = TRADE_TYPES.find(t => t.id === selected);
        if (!trade) return null;

        return (
          <div className="mt-4 space-y-3">
            {/* Selected trade confirmation */}
            <div className="flex items-center gap-3 p-3 bg-enb-green/5 border border-enb-green/20 rounded-xl">
              <span className="text-3xl">{trade.emoji}</span>
              <div>
                <div className={`font-bold text-enb-green ${isUrdu ? 'font-urdu text-base' : 'text-sm'}`}>
                  {isUrdu ? trade.ur : trade.en}
                </div>
                <div className={`text-xs text-enb-text-secondary ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? trade.description_ur : trade.description_en}
                </div>
              </div>
            </div>

            {/* Photo instruction panels */}
            {trade.beforeAfter ? (
              // Before + After trade — show two-panel guide
              <div className="space-y-2">
                <p className={`text-xs font-semibold text-enb-text-secondary uppercase tracking-wide ${isUrdu ? 'font-urdu text-sm normal-case' : ''}`}>
                  {isUrdu ? 'تصویر کی ہدایات' : 'Photo Instructions'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Before panel */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{trade.beforeScene}</span>
                    </div>
                    <div className={`text-[10px] font-bold text-orange-700 uppercase tracking-wide ${isUrdu ? 'font-urdu text-xs normal-case' : ''}`}>
                      {isUrdu ? 'پہلے کی تصویر' : 'BEFORE Photo'}
                    </div>
                    <p className={`text-xs text-orange-800 leading-tight ${isUrdu ? 'font-urdu text-sm' : ''}`}>
                      {isUrdu ? trade.beforeHint_ur : trade.beforeHint_en}
                    </p>
                    {/* Visual camera prompt */}
                    <div className="flex items-center gap-1 text-orange-600">
                      <span className="text-lg">📷</span>
                      <span className={`text-[10px] font-semibold ${isUrdu ? 'font-urdu text-xs' : ''}`}>
                        {isUrdu ? 'ابھی تصویر لیں' : 'Take photo now'}
                      </span>
                    </div>
                  </div>

                  {/* After panel */}
                  <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{trade.afterScene}</span>
                    </div>
                    <div className={`text-[10px] font-bold text-enb-green uppercase tracking-wide ${isUrdu ? 'font-urdu text-xs normal-case' : ''}`}>
                      {isUrdu ? 'بعد کی تصویر' : 'AFTER Photo'}
                    </div>
                    <p className={`text-xs text-enb-text-secondary leading-tight ${isUrdu ? 'font-urdu text-sm' : ''}`}>
                      {isUrdu ? trade.afterHint_ur : trade.afterHint_en}
                    </p>
                    <div className="flex items-center gap-1 text-enb-green">
                      <span className="text-lg">📷</span>
                      <span className={`text-[10px] font-semibold ${isUrdu ? 'font-urdu text-xs' : ''}`}>
                        {isUrdu ? 'کام کے بعد لیں' : 'Take after work'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Single evidence trade — show one-panel guide
              <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{trade.afterScene}</span>
                  <div className={`text-xs font-bold text-enb-green uppercase tracking-wide ${isUrdu ? 'font-urdu text-sm normal-case' : ''}`}>
                    {isUrdu ? 'تصویر کی ہدایت' : 'Photo Instruction'}
                  </div>
                </div>
                <p className={`text-xs text-enb-text-secondary leading-relaxed ${isUrdu ? 'font-urdu text-sm' : ''}`}>
                  {isUrdu ? trade.afterHint_ur : trade.afterHint_en}
                </p>
                <div className="flex items-center gap-1.5 text-enb-green pt-1">
                  <span className="text-lg">📷</span>
                  <span className={`text-xs font-semibold ${isUrdu ? 'font-urdu' : ''}`}>
                    {isUrdu ? 'مکمل کام کی تصویر لیں' : 'Photograph your completed work'}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
