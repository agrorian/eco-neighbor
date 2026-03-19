import { useState, useEffect } from 'react';
import { Bug, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

const SEVERITY_COLORS: Record<string, string> = {
  critical:   'bg-red-100 text-red-700 border-red-200',
  major:      'bg-orange-100 text-orange-700 border-orange-200',
  minor:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  suggestion: 'bg-blue-100 text-blue-700 border-blue-200',
};

const STATUS_COLORS: Record<string, string> = {
  open:        'bg-red-50 text-red-600',
  in_progress: 'bg-yellow-50 text-yellow-600',
  resolved:    'bg-green-50 text-green-600',
  wont_fix:    'bg-gray-100 text-gray-500',
};

const SEVERITY_ICONS: Record<string, string> = {
  critical: '🔴', major: '🟠', minor: '🟡', suggestion: '💡'
};

interface BugReport {
  id: string;
  title: string;
  description: string;
  screen: string;
  severity: string;
  screenshot_url: string | null;
  email: string | null;
  user_id: string | null;
  browser_info: string | null;
  source: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

export default function AdminBugReports() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setReports(data);
      const notes: Record<string, string> = {};
      data.forEach(r => { if (r.admin_note) notes[r.id] = r.admin_note; });
      setAdminNotes(notes);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bug_reports').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const saveNote = async (id: string) => {
    setSaving(id);
    await supabase.from('bug_reports').update({
      admin_note: adminNotes[id] || null,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    setSaving(null);
  };

  const filtered = reports.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
    return true;
  });

  const counts = {
    open: reports.filter(r => r.status === 'open').length,
    critical: reports.filter(r => r.severity === 'critical' && r.status === 'open').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary flex items-center gap-2">
            <Bug className="w-6 h-6 text-red-500" /> Bug Reports
          </h1>
          <p className="text-sm text-enb-text-secondary mt-0.5">
            {counts.open} open · {counts.critical > 0 ? `${counts.critical} critical` : 'no critical'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select onValueChange={setFilterStatus} defaultValue="all">
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="wont_fix">Won't Fix</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={setFilterSeverity} defaultValue="all">
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">🔴 Critical</SelectItem>
            <SelectItem value="major">🟠 Major</SelectItem>
            <SelectItem value="minor">🟡 Minor</SelectItem>
            <SelectItem value="suggestion">💡 Suggestion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-enb-text-secondary">Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-enb-text-secondary">
          <Bug className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>No bug reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => (
            <div key={report.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header row */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === report.id ? null : report.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_COLORS[report.severity]}`}>
                        {SEVERITY_ICONS[report.severity]} {report.severity}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[report.status]}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {report.source}
                      </span>
                    </div>
                    <p className="font-semibold text-enb-text-primary text-sm truncate">{report.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {report.screen} · {new Date(report.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      {report.email && ` · ${report.email}`}
                    </p>
                  </div>
                  {expanded === report.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                  }
                </div>
              </div>

              {/* Expanded details */}
              {expanded === report.id && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm text-enb-text-secondary whitespace-pre-wrap">{report.description}</p>
                  </div>

                  {report.screenshot_url && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Screenshot</p>
                      <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-enb-green hover:underline mb-2">
                        <ExternalLink className="w-3 h-3" /> Open full size
                      </a>
                      <img src={report.screenshot_url} alt="Screenshot" className="w-full max-h-64 object-cover rounded-lg border border-gray-200" />
                    </div>
                  )}

                  {report.browser_info && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Browser</p>
                      <p className="text-xs text-gray-400 font-mono break-all">{report.browser_info}</p>
                    </div>
                  )}

                  {/* Status update */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
                    <div className="flex gap-2 flex-wrap">
                      {['open','in_progress','resolved','wont_fix'].map(s => (
                        <button key={s}
                          onClick={() => updateStatus(report.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                            report.status === s
                              ? 'bg-enb-green text-white border-enb-green'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-enb-green'
                          }`}
                        >
                          {s.replace('_',' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin note */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Admin Note</p>
                    <textarea
                      className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none h-20 focus:outline-none focus:border-enb-green"
                      placeholder="Add internal notes about this bug..."
                      value={adminNotes[report.id] || ''}
                      onChange={e => setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => saveNote(report.id)} disabled={saving === report.id}
                      className="mt-1 bg-enb-green text-white text-xs h-7">
                      {saving === report.id ? 'Saving...' : 'Save Note'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
