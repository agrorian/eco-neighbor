import { useState, useEffect, useRef } from 'react';
import { ClipboardList, CheckCircle, Loader2, Calendar, AlertCircle, Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import { Navigate } from 'react-router-dom';

const ALLOWED_ROLES = ['founder', 'moderator', 'admin', 'organiser'];
const MAX_CHARS = 2000;

interface LogEntry {
  id: string; log_date: string; category: string; description: string; is_absence: boolean;
}

export default function MyLog() {
  const { user } = useUserStore();
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
    const today = new Date().toISOString().split('T')[0];
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
      setTodayLog({ id: 'new', log_date: new Date().toISOString().split('T')[0], category, description, is_absence: false });
      fetchLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to submit log.');
    } finally { setSubmitting(false); }
  };

  const totalChars = buildDescription().length;
  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' });
  const absences = recentLogs.filter(l => l.is_absence).length;

  const parseLog = (description: string) => {
    const sections: Record<string, string> = {};
    const parts = description.split(/\n\n(?=[A-Z ]+:)/);
    parts.forEach(part => {
      const colonIdx = part.indexOf(':');
      if (colonIdx > -1) {
        const key = part.slice(0, colonIdx).trim();
        const val = part.slice(colonIdx + 1).trim();
        sections[key] = val;
      }
    });
    return sections;
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-enb-green" /> Daily Log
        </h1>
        <p className="text-sm text-enb-text-secondary">{today}</p>
      </header>

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
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{todayLog.category}</div>
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
              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-enb-text-primary">Category <span className="text-red-500">*</span></label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMUNITY">🤝 Community Building</SelectItem>
                    <SelectItem value="TECHNICAL">⚙️ Technical / Administrative</SelectItem>
                    <SelectItem value="PARTNERSHIP">🤲 Partnership Development</SelectItem>
                    <SelectItem value="GOVERNANCE">🏛️ Governance & Compliance</SelectItem>
                    <SelectItem value="MARKETING">📣 Marketing & Outreach</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-enb-text-primary">
                  Summary <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">(What did you do for ENB today?)</span>
                </label>
                <Textarea placeholder="Brief overview of today's work..." className="h-24 resize-none bg-white"
                  value={summary} onChange={e => setSummary(e.target.value)} />
              </div>

              {/* Completed */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-enb-text-primary">Tasks Completed</label>
                <Textarea placeholder="List specific tasks, meetings, or actions completed..." className="h-24 resize-none bg-white"
                  value={completed} onChange={e => setCompleted(e.target.value)} />
              </div>

              {/* Blockers */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-enb-text-primary">Blockers / Challenges</label>
                <Textarea placeholder="Any obstacles, delays, or issues encountered..." className="h-20 resize-none bg-white"
                  value={blockers} onChange={e => setBlockers(e.target.value)} />
              </div>

              {/* Next Steps */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-enb-text-primary">Next Steps</label>
                <Textarea placeholder="What will you focus on tomorrow or next session?" className="h-20 resize-none bg-white"
                  value={nextSteps} onChange={e => setNextSteps(e.target.value)} />
              </div>

              {/* File attachment */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-enb-text-primary">Attach Report (optional)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-enb-green/40 hover:bg-enb-green/5 transition-colors"
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {attachmentName ? <FileText className="w-5 h-5 text-enb-green" /> : <Upload className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {attachmentName ? (
                      <p className="text-sm font-medium text-enb-text-primary truncate">{attachmentName}</p>
                    ) : (
                      <p className="text-sm text-gray-400">Click to attach a Word doc, PDF, or image</p>
                    )}
                  </div>
                  {attachmentName && (
                    <button onClick={e => { e.stopPropagation(); setAttachmentName(''); }} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".doc,.docx,.pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
                <p className="text-xs text-gray-400">Note: file name is recorded. For now, share the actual file via WhatsApp with your team.</p>
              </div>

              {/* Char count */}
              <p className={`text-xs text-right ${totalChars > MAX_CHARS ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                {totalChars}/{MAX_CHARS} characters
              </p>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button onClick={handleSubmit} disabled={!category || !summary.trim() || submitting || totalChars > MAX_CHARS}
                className="w-full bg-enb-green hover:bg-enb-green/90 text-white">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit Today\'s Log'}
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
                    {log.is_absence ? 'Absent' : log.category}
                  </span>
                </div>
                {!log.is_absence && (
                  <div className="space-y-1">
                    {sections['SUMMARY'] && <p className="text-sm text-enb-text-secondary line-clamp-2">{sections['SUMMARY']}</p>}
                    {sections['ATTACHMENT'] && (
                      <p className="text-xs text-enb-green flex items-center gap-1 mt-1">
                        <FileText className="w-3 h-3" /> {sections['ATTACHMENT']}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
