import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import { Navigate } from 'react-router-dom';

const ALLOWED_ROLES = ['founder', 'moderator', 'admin', 'organiser'];

interface LogEntry {
  id: string; log_date: string; category: string; description: string; is_absence: boolean;
}

export default function MyLog() {
  const { user } = useUserStore();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [todayLog, setTodayLog] = useState<LogEntry | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('log_date', { ascending: false })
      .limit(14);
    if (data) {
      setTodayLog(data.find(l => l.log_date === today) || null);
      setRecentLogs(data);
      if (data.find(l => l.log_date === today)) setSubmitted(true);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!category || !description.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { data, error } = await supabase.rpc('submit_daily_log', {
        p_user_id: user!.id,
        p_category: category,
        p_description: description.trim(),
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to submit');
      setSubmitted(true);
      setTodayLog({ id: 'new', log_date: new Date().toISOString().split('T')[0], category, description, is_absence: false });
      fetchLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to submit log.');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' });
  const absences = recentLogs.filter(l => l.is_absence).length;

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto">
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
            <p className="font-bold">⚠️ {absences} consecutive day{absences > 1 ? 's' : ''} without a log</p>
            <p>3 consecutive absences triggers a WhatsApp alert to you and the Visionary Founder.</p>
          </div>
        </div>
      )}

      {/* Today's log */}
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-bold text-enb-text-primary">Today's Contribution</h3>

          {submitted && todayLog ? (
            <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-enb-green font-bold">
                <CheckCircle className="w-5 h-5" /> Log submitted for today
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{todayLog.category}</div>
              <p className="text-sm text-enb-text-secondary">{todayLog.description}</p>
              <Button variant="ghost" size="sm" onClick={() => { setSubmitted(false); setCategory(todayLog.category); setDescription(todayLog.description); }}
                className="text-xs text-gray-400">Edit today's log</Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-enb-text-primary">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMUNITY">🤝 Community Building</SelectItem>
                    <SelectItem value="TECHNICAL">⚙️ Technical / Administrative</SelectItem>
                    <SelectItem value="PARTNERSHIP">🤲 Partnership Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-enb-text-primary">What did you do for ENB today?</label>
                <Textarea
                  placeholder="Describe your contribution (max 500 characters)..."
                  className="h-32 resize-none bg-white"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                />
                <p className="text-xs text-gray-400 text-right">{description.length}/500</p>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={handleSubmit} disabled={!category || !description.trim() || submitting}
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
          recentLogs.map(log => (
            <div key={log.id} className={`p-4 rounded-xl border flex items-start gap-3 ${log.is_absence ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${log.is_absence ? 'bg-red-400' : 'bg-enb-green'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">{new Date(log.log_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.is_absence ? 'bg-red-100 text-red-700' : 'bg-enb-green/10 text-enb-green'}`}>
                    {log.is_absence ? 'Absent' : log.category}
                  </span>
                </div>
                {!log.is_absence && <p className="text-sm text-enb-text-secondary mt-1 line-clamp-2">{log.description}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
