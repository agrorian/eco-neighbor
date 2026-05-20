import { useState } from 'react';
import { Clock, Calendar, Check, X, Loader2 } from 'lucide-react';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

// ── AvailabilityPicker — two-tab visual-first availability setter ─────────────
// Tab 1: Right Now — Available Now (with duration) / Busy / Clear
// Tab 2: Weekly Schedule — day-by-day From/To picker stored as JSONB

const DURATION_OPTIONS = [
  { label: '1 hour',   labelUr: '1 گھنٹہ',   minutes: 60 },
  { label: '2 hours',  labelUr: '2 گھنٹے',   minutes: 120 },
  { label: '3 hours',  labelUr: '3 گھنٹے',   minutes: 180 },
  { label: 'Today',    labelUr: 'آج سارا دن', minutes: 1440 },
];

const DAYS = [
  { key: 'Mon', label: 'Mon', labelUr: 'پیر' },
  { key: 'Tue', label: 'Tue', labelUr: 'منگل' },
  { key: 'Wed', label: 'Wed', labelUr: 'بدھ' },
  { key: 'Thu', label: 'Thu', labelUr: 'جمعرات' },
  { key: 'Fri', label: 'Fri', labelUr: 'جمعہ' },
  { key: 'Sat', label: 'Sat', labelUr: 'ہفتہ' },
  { key: 'Sun', label: 'Sun', labelUr: 'اتوار' },
];

type WeekSchedule = Record<string, { from: string; to: string } | null>;

interface Props {
  initialAvailability?: string;
  initialSchedule?: WeekSchedule | null;
  isUrdu?: boolean;
  onClose: () => void;
  onSaved: (availability: string, schedule: WeekSchedule | null) => void;
}

export default function AvailabilityPicker({
  initialAvailability = 'not_set',
  initialSchedule = null,
  isUrdu = false,
  onClose,
  onSaved,
}: Props) {
  const { user } = useUserStore();
  const [tab, setTab] = useState<'now' | 'weekly'>('now');
  const [saving, setSaving] = useState(false);

  // Right Now state
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [nowMode, setNowMode] = useState<'available' | 'busy' | null>(null);

  // Weekly schedule state
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const base: WeekSchedule = {};
    DAYS.forEach(d => { base[d.key] = null; });
    if (initialSchedule) {
      Object.entries(initialSchedule).forEach(([k, v]) => { base[k] = v; });
    }
    return base;
  });

  const toggleDay = (key: string) => {
    setSchedule(prev => ({
      ...prev,
      [key]: prev[key] ? null : { from: '08:00', to: '18:00' },
    }));
  };

  const updateTime = (key: string, field: 'from' | 'to', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [key]: prev[key] ? { ...prev[key]!, [field]: value } : { from: '08:00', to: '18:00', [field]: value },
    }));
  };

  const handleSaveNow = async () => {
    if (!user) return;
    setSaving(true);

    let availability = 'not_set';
    let until: string | null = null;

    if (nowMode === 'available' && selectedDuration) {
      availability = 'available_now';
      const d = new Date();
      d.setMinutes(d.getMinutes() + selectedDuration);
      until = d.toISOString();
    } else if (nowMode === 'busy') {
      availability = 'busy';
    }

    await getDb().from('users').update({
      trade_availability: availability,
      trade_availability_until: until,
      trade_availability_updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    setSaving(false);
    onSaved(availability, initialSchedule);
    onClose();
  };

  const handleSaveWeekly = async () => {
    if (!user) return;
    setSaving(true);

    // Only keep active days
    const activeSchedule: WeekSchedule = {};
    DAYS.forEach(d => { if (schedule[d.key]) activeSchedule[d.key] = schedule[d.key]; });
    const hasSchedule = Object.keys(activeSchedule).length > 0;

    await getDb().from('users').update({
      trade_availability_schedule: hasSchedule ? activeSchedule : null,
      trade_availability_updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    setSaving(false);
    onSaved(initialAvailability, hasSchedule ? activeSchedule : null);
    onClose();
  };

  const handleClear = async () => {
    if (!user) return;
    setSaving(true);
    await getDb().from('users').update({
      trade_availability: 'not_set',
      trade_availability_until: null,
      trade_availability_schedule: null,
      trade_availability_updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    setSaving(false);
    onSaved('not_set', null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-enb-text-primary">
            📅 {isUrdu ? 'دستیابی سیٹ کریں' : 'Set Availability'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('now')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              tab === 'now' ? 'text-enb-green border-b-2 border-enb-green' : 'text-gray-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            {isUrdu ? 'ابھی' : 'Right Now'}
          </button>
          <button
            onClick={() => setTab('weekly')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              tab === 'weekly' ? 'text-enb-green border-b-2 border-enb-green' : 'text-gray-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {isUrdu ? 'ہفتہ وار' : 'Weekly Schedule'}
          </button>
        </div>

        <div className="p-4 space-y-4">
          {tab === 'now' ? (
            <>
              {/* Available Now */}
              <div>
                <button
                  onClick={() => setNowMode(nowMode === 'available' ? null : 'available')}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    nowMode === 'available' ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className="text-3xl">🟢</span>
                  <div className="text-left flex-1">
                    <p className="font-bold text-enb-text-primary">
                      {isUrdu ? 'ابھی دستیاب ہوں' : 'Available Now'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isUrdu ? 'کتنی دیر کے لیے؟' : 'How long are you available?'}
                    </p>
                  </div>
                  {nowMode === 'available' && <Check className="w-5 h-5 text-green-500" />}
                </button>

                {nowMode === 'available' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {DURATION_OPTIONS.map(opt => (
                      <button
                        key={opt.minutes}
                        onClick={() => setSelectedDuration(opt.minutes)}
                        className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                          selectedDuration === opt.minutes
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-100 text-gray-600 hover:border-gray-200'
                        }`}
                      >
                        {isUrdu ? opt.labelUr : opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Busy */}
              <button
                onClick={() => setNowMode(nowMode === 'busy' ? null : 'busy')}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  nowMode === 'busy' ? 'border-amber-400 bg-amber-50' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <span className="text-3xl">🟡</span>
                <div className="text-left flex-1">
                  <p className="font-bold text-enb-text-primary">
                    {isUrdu ? 'مصروف ہوں' : 'Busy'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isUrdu ? 'ابھی کام نہیں لے سکتا' : 'Not taking new jobs right now'}
                  </p>
                </div>
                {nowMode === 'busy' && <Check className="w-5 h-5 text-amber-500" />}
              </button>

              <button
                onClick={handleSaveNow}
                disabled={!nowMode || (nowMode === 'available' && !selectedDuration) || saving}
                className="w-full h-12 bg-enb-green text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isUrdu ? 'محفوظ کریں' : 'Save Status'}
              </button>
            </>
          ) : (
            <>
              {/* Weekly schedule */}
              <p className="text-xs text-gray-400">
                {isUrdu
                  ? 'ہر دن کے لیے کام کے اوقات سیٹ کریں'
                  : 'Set your working hours for each day of the week'}
              </p>

              <div className="space-y-2">
                {DAYS.map(day => {
                  const active = !!schedule[day.key];
                  return (
                    <div key={day.key} className={`rounded-xl border-2 overflow-hidden transition-all ${active ? 'border-enb-teal' : 'border-gray-100'}`}>
                      <button
                        onClick={() => toggleDay(day.key)}
                        className={`w-full flex items-center gap-3 p-3 transition-colors ${active ? 'bg-enb-teal/5' : 'bg-gray-50'}`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          active ? 'border-enb-teal bg-enb-teal' : 'border-gray-300'
                        }`}>
                          {active && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="font-semibold text-sm text-enb-text-primary">
                          {isUrdu ? day.labelUr : day.label}
                        </span>
                      </button>

                      {active && schedule[day.key] && (
                        <div className="flex items-center gap-2 px-3 pb-3 bg-enb-teal/5">
                          <Clock className="w-3.5 h-3.5 text-enb-teal flex-shrink-0" />
                          <input
                            type="time"
                            value={schedule[day.key]!.from}
                            onChange={e => updateTime(day.key, 'from', e.target.value)}
                            className="text-sm border border-enb-teal/30 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-enb-teal w-28"
                          />
                          <span className="text-xs text-gray-400">→</span>
                          <input
                            type="time"
                            value={schedule[day.key]!.to}
                            onChange={e => updateTime(day.key, 'to', e.target.value)}
                            className="text-sm border border-enb-teal/30 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-enb-teal w-28"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleSaveWeekly}
                disabled={saving}
                className="w-full h-12 bg-enb-teal text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isUrdu ? 'شیڈول محفوظ کریں' : 'Save Schedule'}
              </button>
            </>
          )}

          {/* Clear all */}
          <button
            onClick={handleClear}
            disabled={saving}
            className="w-full text-sm text-gray-400 py-2 hover:text-red-400 transition-colors"
          >
            {isUrdu ? 'تمام اسٹیٹس صاف کریں' : 'Clear all availability'}
          </button>
        </div>
      </div>
    </div>
  );
}
