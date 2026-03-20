import { useState, useEffect, useRef } from 'react';
import { ClipboardList, CheckCircle, Loader2, Calendar, AlertCircle, Upload, X, FileText, BarChart2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import { Navigate } from 'react-router-dom';

const ALLOWED_ROLES = ['founder', 'moderator', 'admin', 'organiser'];
const MAX_CHARS = 2000;

const CATEGORY_LABELS: Record<string, string> = {
  COMMUNITY: '🤝 Community Building',
  TECHNICAL: '⚙️ Technical / Administrative',
  PARTNERSHIP: '🤲 Partnership Development',
  GOVERNANCE: '🏛️ Governance & Compliance',
  MARKETING: '📣 Marketing & Outreach',
};

// PKT-aware date — always returns today's date in Asia/Karachi timezone
function getPKTDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }); // en-CA gives YYYY-MM-DD format
}

interface LogEntry {
  id: string; log_date: string; category: string; description: string; is_absence: boolean;
}

interface ReportData {
  user_name: string;
  from_date: string;
  to_date: string;
  total_days: number;
  logged_days: number;
  absent_days: number;
  missed_days: number;
  categories: { category: string; count: number }[];
  entries: { log_date: string; category: string; description: string }[];
}

// ─── Helpers ────────────────────────────────────────────────
function getWeekRange(offset = 0): { from: string; to: string; label: string } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => getPKTDate(d);
  const label = offset === 0 ? 'This Week'
    : offset === -1 ? 'Last Week'
    : `${monday.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}`;
  return { from: fmt(monday), to: fmt(sunday), label };
}

function getMonthRange(offset = 0): { from: string; to: string; label: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const fmt = (dt: Date) => dt.toISOString().split('T')[0];
  const label = offset === 0 ? 'This Month'
    : offset === -1 ? 'Last Month'
    : d.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
  return { from: fmt(from), to: fmt(to), label };
}

function parseLog(description: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = description.split(/\n\n(?=[A-Z ]+:)/);
  parts.forEach(part => {
    const colonIdx = part.indexOf(':');
    if (colonIdx > -1) {
      sections[part.slice(0, colonIdx).trim()] = part.slice(colonIdx + 1).trim();
    }
  });
  return sections;
}


// ─── Report Tab ───────────────────────────────────────────────
function ReportTab({ userId }: { userId: string }) {
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');
  const [offset, setOffset] = useState(0);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const range = mode === 'weekly' ? getWeekRange(offset) : getMonthRange(offset);

  useEffect(() => {
    fetchReport();
  }, [mode, offset]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase.rpc('generate_log_report', {
      p_user_id: userId,
      p_from_date: range.from,
      p_to_date: range.to,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data?.success) setReport(data);
    else setError(data?.error || 'Failed to load report.');
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!report) return;
    setDownloading(true);
    try {
    // Load jsPDF from CDN if not already loaded
    if (!(window as any).jsPDF) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(script);
      });
    }

    const jsPDFModule = (window as any).jspdf || (window as any).jsPDF;
    const { jsPDF } = jsPDFModule;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = 0;

    // ── Colour palette ──────────────────────────────────────
    const GREEN  = [26, 107, 60] as [number, number, number];
    const GOLD   = [212, 160, 23] as [number, number, number];
    const DARK   = [30, 30, 30] as [number, number, number];
    const LIGHT  = [245, 248, 245] as [number, number, number];
    const GRAY   = [120, 120, 120] as [number, number, number];
    const WHITE  = [255, 255, 255] as [number, number, number];

    const setFont = (style: 'normal'|'bold', size: number, color = DARK) => {
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      doc.setTextColor(...color);
    };

    const addPage = () => {
      doc.addPage();
      y = margin;
    };

    const checkY = (needed: number) => {
      if (y + needed > 272) addPage();
    };

    // ── Header banner ───────────────────────────────────────
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageW, 42, 'F');

    // ENB logo placeholder (green circle with leaf)
    doc.setFillColor(...GOLD);
    doc.circle(margin + 8, 21, 8, 'F');
    doc.setFillColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text('ENB', margin + 4.5, 24.5);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...WHITE);
    doc.text('Responsibility Report', margin + 22, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 230, 210);
    doc.text(`${report.user_name}  ·  ${range.label}`, margin + 22, 25);
    doc.text(`${report.from_date}  →  ${report.to_date}`, margin + 22, 31);

    // Generated date (top right)
    doc.setFontSize(8);
    doc.setTextColor(180, 220, 190);
    const genDate = new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Generated: ${genDate}`, pageW - margin, 37, { align: 'right' });

    y = 52;

    // ── Attendance section ──────────────────────────────────
    doc.setFillColor(...LIGHT);
    doc.roundedRect(margin, y, contentW, 38, 3, 3, 'F');

    setFont('bold', 11, GREEN);
    doc.text('ATTENDANCE', margin + 5, y + 8);

    // Stats boxes
    const statW = (contentW - 10) / 3;
    const stats = [
      { label: 'Days Logged', value: String(report.logged_days), color: GREEN },
      { label: 'Days Absent', value: String(report.absent_days), color: [200, 50, 50] as [number,number,number] },
      { label: 'Days Missed', value: String(report.missed_days), color: [220, 130, 0] as [number,number,number] },
    ];
    stats.forEach((s, i) => {
      const bx = margin + 5 + i * (statW + 0);
      doc.setFillColor(...WHITE);
      doc.roundedRect(bx, y + 12, statW - 2, 20, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...s.color);
      doc.text(s.value, bx + (statW - 2) / 2, y + 25, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(s.label.toUpperCase(), bx + (statW - 2) / 2, y + 30, { align: 'center' });
    });

    // Attendance % bar
    const attendPct = Math.round((report.logged_days / Math.max(report.total_days, 1)) * 100);
    const barColor: [number,number,number] = attendPct >= 80 ? GREEN : attendPct >= 50 ? [220,130,0] : [200,50,50];
    doc.setFillColor(220, 230, 220);
    doc.roundedRect(margin + 5, y + 33, contentW - 10, 3, 1, 1, 'F');
    if (attendPct > 0) {
      doc.setFillColor(...barColor);
      doc.roundedRect(margin + 5, y + 33, (contentW - 10) * attendPct / 100, 3, 1, 1, 'F');
    }
    setFont('bold', 8, barColor);
    doc.text(`${attendPct}% attendance`, pageW - margin - 5, y + 35.5, { align: 'right' });

    y += 46;

    // ── Category breakdown ──────────────────────────────────
    if (report.categories.length > 0) {
      checkY(14 + report.categories.length * 9);
      setFont('bold', 11, GREEN);
      doc.text('CATEGORY BREAKDOWN', margin, y + 6);
      y += 10;

      const catLabels: Record<string, string> = {
        COMMUNITY: 'Community Building',
        TECHNICAL: 'Technical / Administrative',
        PARTNERSHIP: 'Partnership Development',
        GOVERNANCE: 'Governance & Compliance',
        MARKETING: 'Marketing & Outreach',
      };

      report.categories.forEach((c, idx) => {
        checkY(9);
        const label = catLabels[c.category] || c.category;
        const pct = Math.round((c.count / Math.max(report.logged_days, 1)) * 100);
        const barW = (contentW - 70) * pct / 100;

        // Alternating row background
        if (idx % 2 === 0) {
          doc.setFillColor(...LIGHT);
          doc.rect(margin, y - 1, contentW, 8, 'F');
        }

        setFont('normal', 8, DARK);
        doc.text(label, margin + 2, y + 4.5);
        doc.setFillColor(220, 230, 220);
        doc.roundedRect(margin + contentW - 68, y + 1, 50, 4, 1, 1, 'F');
        doc.setFillColor(...GREEN);
        if (barW > 0) doc.roundedRect(margin + contentW - 68, y + 1, barW * (50 / (contentW - 70)), 4, 1, 1, 'F');
        setFont('bold', 8, DARK);
        doc.text(`${c.count}d`, margin + contentW - 5, y + 4.5, { align: 'right' });
        y += 8;
      });
      y += 4;
    }

    // ── Daily entries ───────────────────────────────────────
    if (report.entries.length > 0) {
      checkY(12);
      setFont('bold', 11, GREEN);
      doc.text('DAILY ENTRIES', margin, y + 6);
      y += 12;

      const sectionLabels: Record<string, string> = {
        SUMMARY: 'Summary',
        COMPLETED: 'Completed',
        BLOCKERS: 'Blockers',
        'NEXT STEPS': 'Next Steps',
      };

      const catLabels2: Record<string, string> = {
        COMMUNITY: 'Community Building',
        TECHNICAL: 'Technical / Admin',
        PARTNERSHIP: 'Partnership',
        GOVERNANCE: 'Governance',
        MARKETING: 'Marketing',
      };

      report.entries.forEach((entry) => {
        // Parse sections
      const sections: Record<string, string> = {};
      // Use same parsing as UI parseLog — split on double newline before UPPERCASE KEY:
      const parts = entry.description.split(/\n\n(?=[A-Z ]+:)/);
      parts.forEach(part => {
        const colonIdx = part.indexOf(':');
        if (colonIdx > -1) {
          const key = part.slice(0, colonIdx).trim();
          const val = part.slice(colonIdx + 1).trim();
          if (key) sections[key] = val;
        }
      });

        // Estimate height needed
        let heightNeeded = 14;
        Object.entries(sections).forEach(([, val]) => {
          if (val) {
            const lines = doc.splitTextToSize(val, contentW - 30);
            heightNeeded += lines.length * 4.5 + 6;
          }
        });
        checkY(heightNeeded);

        // Entry card background
        doc.setFillColor(...LIGHT);
        doc.roundedRect(margin, y, contentW, heightNeeded - 2, 2, 2, 'F');

        // Date + category header
        doc.setFillColor(...GREEN);
        doc.roundedRect(margin, y, contentW, 9, 2, 2, 'F');
        doc.rect(margin, y + 5, contentW, 4, 'F'); // flatten bottom corners

        const entryDate = new Date(entry.log_date).toLocaleDateString('en-PK', {
          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
        setFont('bold', 9, WHITE);
        doc.text(entryDate, margin + 4, y + 6.5);
        setFont('normal', 8, [180, 230, 200] as [number,number,number]);
        doc.text(catLabels2[entry.category] || entry.category, pageW - margin - 4, y + 6.5, { align: 'right' });

        y += 11;

        // Check if any structured sections exist
        const hasSections = Object.keys(sectionLabels).some(k => sections[k]);

        if (hasSections) {
          // Render structured sections (SUMMARY, COMPLETED, etc.)
          Object.entries(sectionLabels).forEach(([key, label]) => {
            const val = sections[key];
            if (!val) return;
            const lines = doc.splitTextToSize(val, contentW - 28);
            setFont('bold', 8, GREEN);
            doc.text(`${label}:`, margin + 4, y + 3.5);
            setFont('normal', 8, DARK);
            doc.text(lines, margin + 28, y + 3.5);
            y += lines.length * 4.5 + 3;
          });
        } else {
          // Plain text log — render description directly
          const lines = doc.splitTextToSize(entry.description || '(No description)', contentW - 12);
          setFont('normal', 8, DARK);
          doc.text(lines, margin + 4, y + 3.5);
          y += lines.length * 4.5 + 3;
        }

        y += 5;
      });
    }

    // ── Footer on every page ────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...GREEN);
      doc.rect(0, 287, pageW, 10, 'F');
      setFont('normal', 7, WHITE);
      doc.text('Eco-Neighbor Token · ENB Responsibility Dashboard · eco-neighbor.vercel.app', margin, 293);
      doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 293, { align: 'right' });
    }

    doc.save(`ENB_Report_${report.user_name.replace(/\s+/g, '_')}_${range.from}_${range.to}.pdf`);
    } catch (err: any) {
      console.error('PDF generation failed:', err);
      alert('PDF download failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  const attendancePct = report ? Math.round((report.logged_days / Math.max(report.total_days, 1)) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {(['weekly', 'monthly'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setOffset(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${mode === m ? 'bg-white shadow-sm text-enb-green' : 'text-gray-500'}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Period navigator */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
        <button onClick={() => setOffset(o => o - 1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="text-center">
          <div className="font-bold text-enb-text-primary">{range.label}</div>
          <div className="text-xs text-gray-400">{range.from} → {range.to}</div>
        </div>
        <button onClick={() => setOffset(o => Math.min(o + 1, 0))} disabled={offset === 0}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30">
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-enb-green" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : report ? (
        <>
          {/* Attendance Card */}
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-enb-text-primary">Attendance</h4>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                  attendancePct >= 80 ? 'bg-green-100 text-green-700' :
                  attendancePct >= 50 ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>{attendancePct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${attendancePct >= 80 ? 'bg-enb-green' : attendancePct >= 50 ? 'bg-orange-400' : 'bg-red-500'}`}
                  style={{ width: `${attendancePct}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center pt-1">
                {[
                  { label: 'Logged', value: report.logged_days, color: 'text-enb-green' },
                  { label: 'Absent', value: report.absent_days, color: 'text-red-500' },
                  { label: 'Missed', value: report.missed_days, color: 'text-orange-500' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          {report.categories.length > 0 && (
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <h4 className="font-bold text-enb-text-primary">Category Breakdown</h4>
                {report.categories.map(c => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-enb-text-secondary">{CATEGORY_LABELS[c.category] || c.category}</span>
                      <span className="font-medium text-enb-text-primary">{c.count}d</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-enb-green rounded-full"
                        style={{ width: `${Math.round((c.count / Math.max(report.logged_days, 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Log Entries */}
          {report.entries.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-enb-text-primary">Daily Entries</h4>
              {report.entries.map((e, i) => {
                const sections = parseLog(e.description);
                return (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(e.log_date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-xs bg-enb-green/10 text-enb-green px-2 py-0.5 rounded-full font-medium">
                        {CATEGORY_LABELS[e.category] || e.category}
                      </span>
                    </div>
                    {sections['SUMMARY'] && (
                      <p className="text-sm text-enb-text-secondary">{sections['SUMMARY']}</p>
                    )}
                    {(sections['COMPLETED'] || sections['BLOCKERS'] || sections['NEXT STEPS']) && (
                      <div className="space-y-1 pt-1 border-t border-gray-50">
                        {sections['COMPLETED'] && (
                          <p className="text-xs text-gray-500"><span className="font-semibold">Completed:</span> {sections['COMPLETED']}</p>
                        )}
                        {sections['BLOCKERS'] && (
                          <p className="text-xs text-gray-500"><span className="font-semibold">Blockers:</span> {sections['BLOCKERS']}</p>
                        )}
                        {sections['NEXT STEPS'] && (
                          <p className="text-xs text-gray-500"><span className="font-semibold">Next:</span> {sections['NEXT STEPS']}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {report.entries.length === 0 && report.logged_days === 0 && (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl text-sm">
              No log entries for this period.
            </div>
          )}

          {/* Download */}
          <Button onClick={handleDownload} disabled={downloading} variant="outline" className="w-full border-enb-green/30 text-enb-green hover:bg-enb-green/5">
            {downloading
              ? <><span className="w-4 h-4 mr-2 border-2 border-enb-green border-t-transparent rounded-full animate-spin inline-block" />Generating PDF...</>
              : <><Download className="w-4 h-4 mr-2" />Download PDF Report</>
            }
          </Button>
        </>
      ) : null}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function MyLog() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'log' | 'reports'>('log');
  const [category, setCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [completed, setCompleted] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [todayLog, setTodayLog] = useState<LogEntry | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || !ALLOWED_ROLES.includes(user.role)) return <Navigate to="/" replace />;

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const today = getPKTDate();
    const { data } = await supabase
      .from('daily_logs').select('*').eq('user_id', user!.id)
      .order('log_date', { ascending: false }).limit(14);
    if (data) {
      setTodayLog(data.find(l => l.log_date === today) || null);
      setRecentLogs(data);
      if (data.find(l => l.log_date === today)) setSubmitted(true);
    }
    setLoading(false);
  };

  const buildDescription = () => {
    const parts = [];
    if (summary.trim()) parts.push(`SUMMARY:\n${summary.trim()}`);
    if (completed.trim()) parts.push(`COMPLETED:\n${completed.trim()}`);
    if (blockers.trim()) parts.push(`BLOCKERS:\n${blockers.trim()}`);
    if (nextSteps.trim()) parts.push(`NEXT STEPS:\n${nextSteps.trim()}`);
    if (attachmentName) parts.push(`ATTACHMENT: ${attachmentName}`);
    return parts.join('\n\n');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachmentName(file.name);
  };

  const handleSubmit = async () => {
    const description = buildDescription();
    if (!category || !summary.trim()) return;
    if (description.length > MAX_CHARS) { setError(`Total content exceeds ${MAX_CHARS} characters.`); return; }
    setSubmitting(true); setError('');
    try {
      const { data, error } = await supabase.rpc('submit_daily_log', {
        p_user_id: user!.id, p_category: category, p_description: description,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to submit');
      setSubmitted(true);
      setTodayLog({ id: 'new', log_date: getPKTDate(), category, description, is_absence: false });
      fetchLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to submit log.');
    } finally { setSubmitting(false); }
  };

  const totalChars = buildDescription().length;
  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' });
  const absences = recentLogs.filter(l => l.is_absence).length;

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-enb-green" /> Daily Log
          </h1>
          <p className="text-sm text-enb-text-secondary">{today}</p>
        </div>
      </header>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setActiveTab('log')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'log' ? 'bg-white shadow-sm text-enb-green' : 'text-gray-500'}`}>
          <ClipboardList className="w-4 h-4" /> Today's Log
        </button>
        <button onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'reports' ? 'bg-white shadow-sm text-enb-green' : 'text-gray-500'}`}>
          <BarChart2 className="w-4 h-4" /> Reports
        </button>
      </div>

      {activeTab === 'reports' ? (
        <ReportTab userId={user!.id} />
      ) : (
        <>
          {absences >= 2 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 text-sm text-orange-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">⚠️ {absences} consecutive absence{absences > 1 ? 's' : ''}</p>
                <p>3 consecutive absences triggers a WhatsApp alert to you and the Visionary Founder.</p>
              </div>
            </div>
          )}

          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-5 space-y-5">
              <h3 className="font-bold text-enb-text-primary">Today's Contribution Report</h3>

              {submitted && todayLog ? (
                <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-enb-green font-bold">
                    <CheckCircle className="w-5 h-5" /> Log submitted for today
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{CATEGORY_LABELS[todayLog.category] || todayLog.category}</div>
                  {Object.entries(parseLog(todayLog.description)).map(([key, val]) => (
                    <div key={key} className="text-sm">
                      <span className="font-semibold text-enb-text-primary">{key}: </span>
                      <span className="text-enb-text-secondary whitespace-pre-line">{val}</span>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => setSubmitted(false)} className="text-xs text-gray-400">
                    Edit today's log
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-enb-text-primary">Category <span className="text-red-500">*</span></label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-enb-text-primary">
                      Summary <span className="text-red-500">*</span>
                      <span className="text-gray-400 font-normal ml-1">(What did you do for ENB today?)</span>
                    </label>
                    <Textarea placeholder="Brief overview of today's work..." className="h-24 resize-none bg-white"
                      value={summary} onChange={e => setSummary(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-enb-text-primary">Tasks Completed</label>
                    <Textarea placeholder="List specific tasks, meetings, or actions completed..." className="h-24 resize-none bg-white"
                      value={completed} onChange={e => setCompleted(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-enb-text-primary">Blockers / Challenges</label>
                    <Textarea placeholder="Any obstacles, delays, or issues encountered..." className="h-20 resize-none bg-white"
                      value={blockers} onChange={e => setBlockers(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-enb-text-primary">Next Steps</label>
                    <Textarea placeholder="What will you focus on tomorrow or next session?" className="h-20 resize-none bg-white"
                      value={nextSteps} onChange={e => setNextSteps(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-enb-text-primary">Attach Report (optional)</label>
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-enb-green/40 hover:bg-enb-green/5 transition-colors">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {attachmentName ? <FileText className="w-5 h-5 text-enb-green" /> : <Upload className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {attachmentName
                          ? <p className="text-sm font-medium text-enb-text-primary truncate">{attachmentName}</p>
                          : <p className="text-sm text-gray-400">Click to attach a Word doc, PDF, or image</p>}
                      </div>
                      {attachmentName && (
                        <button onClick={e => { e.stopPropagation(); setAttachmentName(''); }} className="text-gray-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept=".doc,.docx,.pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
                    <p className="text-xs text-gray-400">Note: file name is recorded. Share the actual file via WhatsApp with your team.</p>
                  </div>

                  <p className={`text-xs text-right ${totalChars > MAX_CHARS ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {totalChars}/{MAX_CHARS} characters
                  </p>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button onClick={handleSubmit} disabled={!category || !summary.trim() || submitting || totalChars > MAX_CHARS}
                    className="w-full bg-enb-green hover:bg-enb-green/90 text-white">
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Today's Log"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent logs */}
          <div className="space-y-3">
            <h3 className="font-bold text-enb-text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-enb-text-secondary" /> Last 14 Days
            </h3>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">No logs yet. Submit your first log above.</div>
            ) : (
              recentLogs.map(log => {
                const sections = parseLog(log.description);
                return (
                  <div key={log.id} className={`p-4 rounded-xl border ${log.is_absence ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(log.log_date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.is_absence ? 'bg-red-100 text-red-700' : 'bg-enb-green/10 text-enb-green'}`}>
                        {log.is_absence ? 'Absent' : (CATEGORY_LABELS[log.category] || log.category)}
                      </span>
                    </div>
                    {!log.is_absence && sections['SUMMARY'] && (
                      <p className="text-sm text-enb-text-secondary line-clamp-2">{sections['SUMMARY']}</p>
                    )}
                    {!log.is_absence && sections['ATTACHMENT'] && (
                      <p className="text-xs text-enb-green flex items-center gap-1 mt-1">
                        <FileText className="w-3 h-3" /> {sections['ATTACHMENT']}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
