import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, AlertTriangle, Loader2, Filter, X, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

interface ModSummary {
  id: string;
  name: string;
  totalReviewed: number;
  approved: number;
  rejected: number;
  escalated: number;
  approvalPct: number;
  agreementPct: number;
  aiDivergence: number;
  fraudFlags: number;
}

interface HistoryRow {
  id: string;
  submissionId: string;
  actionType: string;
  submittedBy: string;
  submittedAt: string;
  mod1Id: string;
  mod1Name: string;
  mod1Decision: string | null;
  mod1ReviewedAt: string | null;
  mod2Id: string | null;
  mod2Name: string | null;
  mod2Decision: string | null;
  mod2ReviewedAt: string | null;
  finalOutcome: string;
  aiVerdict: string | null;
  aiConfidence: number | null;
  reportStatus: string | null;
  escalationFlag: boolean;
}

type TimeWindow = '7d' | '30d' | '6m' | '1y' | 'all';
type View = 'list1' | 'list2';

const TIME_LABELS: Record<TimeWindow, string> = {
  '7d': 'Last 7 days', '30d': 'Last 30 days',
  '6m': 'Last 6 months', '1y': 'Last year', 'all': 'All time',
};

function getTimeFilter(window: TimeWindow): string | null {
  if (window === 'all') return null;
  const now = new Date();
  const map: Record<string, number> = { '7d': 7, '30d': 30, '6m': 180, '1y': 365 };
  now.setDate(now.getDate() - map[window]);
  return now.toISOString();
}

function fmtDuration(from: string | null, to: string | null): { text: string; warn: boolean } {
  if (!from || !to) return { text: '—', warn: false };
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (ms < 0) return { text: '—', warn: false };
  const min = Math.floor(ms / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  let text = '';
  if (day >= 1) text = `${day}d ${hr % 24}h`;
  else if (hr >= 1) text = `${hr}h ${min % 60}m`;
  else text = `${min}m`;
  return { text, warn: day >= 2 };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ModPerformance() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('list1');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');

  // List 1 state
  const [summaries, setSummaries] = useState<ModSummary[]>([]);
  const [loadingL1, setLoadingL1] = useState(true);

  // List 2 state
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loadingL2, setLoadingL2] = useState(false);
  const [selectedMod, setSelectedMod] = useState<{ id: string; name: string } | null>(null);

  // List 2 filters
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterActionType, setFilterActionType] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAiDivergence, setFilterAiDivergence] = useState(false);
  const [filterFraudOnly, setFilterFraudOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ── Load List 1 ────────────────────────────────────────────────────────────
  const loadSummaries = useCallback(async () => {
    setLoadingL1(true);
    const since = getTimeFilter(timeWindow);

    let q = getDb()
      .from('moderator_assignments')
      .select(`
        id, mod1_id, mod2_id, decision1, decision2,
        escalation_flag,
        submissions!submission_id(
          id, status, ai_review_verdict, ai_review_confidence, report_status
        ),
        mod1:users!mod1_id(id, full_name),
        mod2:users!mod2_id(id, full_name)
      `)
      .not('decision1', 'is', null);

    if (since) q = q.gte('created_at', since);

    const { data, error } = await q;
    if (error || !data) { setLoadingL1(false); return; }

    // Build per-moderator aggregates
    const modMap: Record<string, ModSummary> = {};

    const ensure = (id: string, name: string) => {
      if (!modMap[id]) {
        modMap[id] = {
          id, name,
          totalReviewed: 0, approved: 0, rejected: 0,
          escalated: 0, approvalPct: 0, agreementPct: 0,
          aiDivergence: 0, fraudFlags: 0,
        };
      }
    };

    let agreementCount: Record<string, { agree: number; total: number }> = {};

    data.forEach((row: any) => {
      const m1id = row.mod1_id;
      const m2id = row.mod2_id;
      const m1name = row.mod1?.full_name || 'Unknown';
      const m2name = row.mod2?.full_name || 'Unknown';
      const d1 = row.decision1;
      const d2 = row.decision2;
      const sub = row.submissions;
      const aiVerdict = sub?.ai_review_verdict;
      const finalStatus = sub?.status;
      const isFraud = sub?.report_status === 'fraudulent';
      const isEscalated = row.escalation_flag;

      // Mod 1
      if (m1id && d1) {
        ensure(m1id, m1name);
        modMap[m1id].totalReviewed++;
        if (d1 === 'APPROVE') modMap[m1id].approved++;
        if (d1 === 'REJECT') modMap[m1id].rejected++;
        if (isEscalated) modMap[m1id].escalated++;
        if (isFraud && d1 === 'APPROVE') modMap[m1id].fraudFlags++;
        if (aiVerdict && d1.toLowerCase() !== aiVerdict) modMap[m1id].aiDivergence++;
        if (!agreementCount[m1id]) agreementCount[m1id] = { agree: 0, total: 0 };
        if (d1 && d2) {
          agreementCount[m1id].total++;
          if (d1 === d2) agreementCount[m1id].agree++;
        }
      }

      // Mod 2
      if (m2id && d2) {
        ensure(m2id, m2name);
        modMap[m2id].totalReviewed++;
        if (d2 === 'APPROVE') modMap[m2id].approved++;
        if (d2 === 'REJECT') modMap[m2id].rejected++;
        if (isEscalated) modMap[m2id].escalated++;
        if (isFraud && d2 === 'APPROVE') modMap[m2id].fraudFlags++;
        if (aiVerdict && d2.toLowerCase() !== aiVerdict) modMap[m2id].aiDivergence++;
        if (!agreementCount[m2id]) agreementCount[m2id] = { agree: 0, total: 0 };
        if (d1 && d2) {
          agreementCount[m2id].total++;
          if (d1 === d2) agreementCount[m2id].agree++;
        }
      }
    });

    // Calculate percentages
    Object.values(modMap).forEach(m => {
      m.approvalPct = m.totalReviewed > 0 ? Math.round((m.approved / m.totalReviewed) * 100) : 0;
      const ag = agreementCount[m.id];
      m.agreementPct = ag && ag.total > 0 ? Math.round((ag.agree / ag.total) * 100) : 0;
    });

    setSummaries(Object.values(modMap).sort((a, b) => b.totalReviewed - a.totalReviewed));
    setLoadingL1(false);
  }, [timeWindow]);

  useEffect(() => { loadSummaries(); }, [loadSummaries]);

  // ── Load List 2 ────────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setLoadingL2(true);
    const since = getTimeFilter(timeWindow);

    let q = getDb()
      .from('moderator_assignments')
      .select(`
        id, mod1_id, mod2_id, decision1, decision2,
        escalation_flag, mod1_reviewed_at, mod2_reviewed_at,
        submissions!submission_id(
          id, action_type, status, submitted_at,
          ai_review_verdict, ai_review_confidence, report_status,
          users!user_id(full_name)
        ),
        mod1:users!mod1_id(id, full_name),
        mod2:users!mod2_id(id, full_name)
      `)
      .order('mod1_reviewed_at', { ascending: false })
      .limit(200);

    if (since) q = q.gte('created_at', since);
    if (selectedMod) {
      q = q.or(`mod1_id.eq.${selectedMod.id},mod2_id.eq.${selectedMod.id}`);
    }

    const { data, error } = await q;
    if (error || !data) { setLoadingL2(false); return; }

    setHistory(data.map((row: any): HistoryRow => ({
      id: row.id,
      submissionId: row.submissions?.id || '',
      actionType: row.submissions?.action_type || '—',
      submittedBy: row.submissions?.users?.full_name || 'Unknown',
      submittedAt: row.submissions?.submitted_at || '',
      mod1Id: row.mod1_id,
      mod1Name: row.mod1?.full_name || 'Unknown',
      mod1Decision: row.decision1,
      mod1ReviewedAt: row.mod1_reviewed_at,
      mod2Id: row.mod2_id,
      mod2Name: row.mod2?.full_name || null,
      mod2Decision: row.decision2,
      mod2ReviewedAt: row.mod2_reviewed_at,
      finalOutcome: row.submissions?.status || 'pending',
      aiVerdict: row.submissions?.ai_review_verdict,
      aiConfidence: row.submissions?.ai_review_confidence,
      reportStatus: row.submissions?.report_status,
      escalationFlag: row.escalation_flag,
    })));

    setLoadingL2(false);
  }, [timeWindow, selectedMod]);

  useEffect(() => {
    if (view === 'list2') loadHistory();
  }, [view, loadHistory]);

  // ── Filter List 2 ──────────────────────────────────────────────────────────
  const filteredHistory = history.filter(row => {
    if (filterOutcome !== 'all' && row.finalOutcome !== filterOutcome) return false;
    if (filterActionType !== 'all' && row.actionType !== filterActionType) return false;
    if (filterSearch && !row.submittedBy.toLowerCase().includes(filterSearch.toLowerCase())
      && !row.mod1Name.toLowerCase().includes(filterSearch.toLowerCase())
      && !(row.mod2Name || '').toLowerCase().includes(filterSearch.toLowerCase())) return false;
    if (filterAiDivergence) {
      const aiV = row.aiVerdict?.toLowerCase();
      const humanV = row.finalOutcome;
      if (!aiV || (aiV === 'approve' && humanV === 'approved') || (aiV === 'reject' && humanV === 'rejected')) return false;
    }
    if (filterFraudOnly && row.reportStatus !== 'fraudulent') return false;
    return true;
  });

  const uniqueActionTypes = [...new Set(history.map(r => r.actionType))].filter(Boolean);

  // ── Navigate to List 2 for a specific mod ────────────────────────────────
  const openModHistory = (mod: ModSummary) => {
    setSelectedMod({ id: mod.id, name: mod.name });
    setView('list2');
  };

  const backToList1 = () => {
    setView('list1');
    setSelectedMod(null);
  };

  // ── Decision badge ────────────────────────────────────────────────────────
  const decisionBadge = (d: string | null) => {
    if (!d) return <span className="text-xs text-gray-300">Pending</span>;
    const cls = d === 'APPROVE'
      ? 'bg-green-50 text-green-700 border border-green-200'
      : 'bg-red-50 text-red-700 border border-red-200';
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{d}</span>;
  };

  const outcomeBadge = (s: string) => {
    const map: Record<string, string> = {
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      escalated: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${map[s] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
        {s}
      </span>
    );
  };

  // ── Time window selector (shared) ─────────────────────────────────────────
  const TimeSelector = () => (
    <div className="flex gap-1 flex-wrap">
      {(Object.keys(TIME_LABELS) as TimeWindow[]).map(w => (
        <button
          key={w}
          onClick={() => setTimeWindow(w)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            timeWindow === w
              ? 'bg-enb-green text-white border-enb-green'
              : 'border-gray-200 text-gray-500 hover:border-enb-green/50'
          }`}
        >
          {TIME_LABELS[w]}
        </button>
      ))}
    </div>
  );

  // ── LIST 1 ─────────────────────────────────────────────────────────────────
  if (view === 'list1') {
    return (
      <div className="space-y-5 pb-24">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-enb-text-primary">Moderator Performance</h1>
            <button
              onClick={() => { setSelectedMod(null); setView('list2'); }}
              className="text-xs text-enb-teal hover:underline"
            >
              Full history →
            </button>
          </div>
          <TimeSelector />
        </div>

        {loadingL1 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-enb-green" />
          </div>
        ) : summaries.length === 0 ? (
          <Card className="border-gray-100 p-10 text-center">
            <p className="text-enb-text-secondary text-sm">No moderation data for this period.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {summaries.map(mod => (
              <Card
                key={mod.id}
                className="border-gray-100 p-4 cursor-pointer hover:border-enb-green/40 transition-colors"
                onClick={() => openModHistory(mod)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-enb-green/10 flex items-center justify-center text-enb-green font-bold text-sm shrink-0">
                      {mod.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-enb-text-primary">{mod.name}</p>
                      <p className="text-xs text-gray-400">{mod.totalReviewed} reviews</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <button
                    onClick={e => { e.stopPropagation(); openModHistory(mod); }}
                    className="bg-green-50 rounded-lg p-2 hover:bg-green-100 transition-colors"
                  >
                    <p className="text-base font-bold text-green-700">{mod.approved}</p>
                    <p className="text-[10px] text-green-600">Approved</p>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); openModHistory(mod); }}
                    className="bg-red-50 rounded-lg p-2 hover:bg-red-100 transition-colors"
                  >
                    <p className="text-base font-bold text-red-700">{mod.rejected}</p>
                    <p className="text-[10px] text-red-600">Rejected</p>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); openModHistory(mod); }}
                    className="bg-purple-50 rounded-lg p-2 hover:bg-purple-100 transition-colors"
                  >
                    <p className="text-base font-bold text-purple-700">{mod.escalated}</p>
                    <p className="text-[10px] text-purple-600">Escalated</p>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); openModHistory(mod); }}
                    className={`rounded-lg p-2 transition-colors ${
                      mod.fraudFlags > 0 ? 'bg-red-100 hover:bg-red-200' : 'bg-gray-50'
                    }`}
                  >
                    <p className={`text-base font-bold ${mod.fraudFlags > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                      {mod.fraudFlags}
                    </p>
                    <p className={`text-[10px] ${mod.fraudFlags > 0 ? 'text-red-600' : 'text-gray-400'}`}>Fraud</p>
                  </button>
                </div>

                {/* Rate indicators */}
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50 text-xs">
                  <div>
                    <span className="text-gray-400">Approval rate </span>
                    <span className="font-semibold text-enb-text-primary">{mod.approvalPct}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Agreement </span>
                    <span className={`font-semibold ${mod.agreementPct < 60 ? 'text-amber-600' : 'text-enb-text-primary'}`}>
                      {mod.agreementPct}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">AI divergence </span>
                    <span className={`font-semibold ${mod.aiDivergence > 5 ? 'text-amber-600' : 'text-enb-text-primary'}`}>
                      {mod.aiDivergence}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── LIST 2 ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={backToList1} className="flex items-center gap-1.5 text-sm text-enb-text-secondary">
            <ArrowLeft className="w-4 h-4" /> All Moderators
          </button>
          {selectedMod && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-medium text-enb-text-primary">{selectedMod.name}</span>
              <button onClick={() => setSelectedMod(null)} className="ml-auto text-xs text-enb-teal hover:underline">
                Clear filter
              </button>
            </>
          )}
        </div>
        <TimeSelector />
      </div>

      {/* Filter bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-enb-green"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors ${
              showFilters ? 'bg-enb-green text-white border-enb-green' : 'border-gray-200 text-gray-500'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <Card className="border-gray-100 p-3 space-y-3">
            {/* Outcome filter */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500">Outcome</p>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'approved', 'rejected', 'pending', 'escalated'].map(o => (
                  <button
                    key={o}
                    onClick={() => setFilterOutcome(o)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                      filterOutcome === o
                        ? 'bg-enb-green text-white border-enb-green'
                        : 'border-gray-200 text-gray-500 hover:border-enb-green/40'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Action type filter */}
            {uniqueActionTypes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">Action type</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterActionType('all')}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      filterActionType === 'all' ? 'bg-enb-green text-white border-enb-green' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    All
                  </button>
                  {uniqueActionTypes.map(t => (
                    <button
                      key={t}
                      onClick={() => setFilterActionType(t)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                        filterActionType === t ? 'bg-enb-green text-white border-enb-green' : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {t.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterAiDivergence(v => !v)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filterAiDivergence ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-500'
                }`}
              >
                AI divergence only
              </button>
              <button
                onClick={() => setFilterFraudOnly(v => !v)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filterFraudOnly ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-500'
                }`}
              >
                Fraud flagged only
              </button>
              <button
                onClick={() => {
                  setFilterOutcome('all');
                  setFilterActionType('all');
                  setFilterSearch('');
                  setFilterAiDivergence(false);
                  setFilterFraudOnly(false);
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Results count */}
      {!loadingL2 && (
        <p className="text-xs text-gray-400">
          {filteredHistory.length} result{filteredHistory.length !== 1 ? 's' : ''}
          {filteredHistory.length !== history.length && ` (filtered from ${history.length})`}
        </p>
      )}

      {/* History rows */}
      {loadingL2 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-enb-green" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <Card className="border-gray-100 p-10 text-center">
          <p className="text-enb-text-secondary text-sm">No records match the current filters.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map(row => {
            const mod1Duration = fmtDuration(row.submittedAt, row.mod1ReviewedAt);
            const mod2Duration = fmtDuration(row.mod1ReviewedAt, row.mod2ReviewedAt);
            const aiDiverges = row.aiVerdict &&
              ((row.aiVerdict === 'approve' && row.finalOutcome === 'rejected') ||
               (row.aiVerdict === 'reject' && row.finalOutcome === 'approved'));

            return (
              <Card key={row.id} className={`border-gray-100 p-4 space-y-3 ${aiDiverges ? 'border-amber-200' : ''}`}>
                {/* Row header */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <button
                    onClick={() => navigate(`/submission/${row.submissionId}`)}
                    className="text-xs text-enb-teal font-mono hover:underline text-left"
                    title="Open submission detail"
                  >
                    {row.submissionId.slice(0, 8)}… ↗
                  </button>
                    <p className="text-sm font-semibold text-enb-text-primary capitalize">
                      {row.actionType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      by <span className="text-enb-text-primary">{row.submittedBy}</span>
                      {row.submittedAt && <> · {fmtDate(row.submittedAt)}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {outcomeBadge(row.finalOutcome)}
                    {row.reportStatus === 'fraudulent' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Fraud
                      </span>
                    )}
                    {row.escalationFlag && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        Escalated
                      </span>
                    )}
                  </div>
                </div>

                {/* Mod decisions */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Mod 1</p>
                    <p className="text-sm font-medium text-enb-text-primary">{row.mod1Name}</p>
                    <div>{decisionBadge(row.mod1Decision)}</div>
                    <p className={`text-[10px] ${mod1Duration.warn ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                      ⏱ {mod1Duration.text}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Mod 2</p>
                    <p className="text-sm font-medium text-enb-text-primary">{row.mod2Name || '—'}</p>
                    <div>{row.mod2Decision ? decisionBadge(row.mod2Decision) : <span className="text-xs text-gray-300">Pending</span>}</div>
                    <p className={`text-[10px] ${mod2Duration.warn ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                      ⏱ {mod2Duration.text}
                    </p>
                  </div>
                </div>

                {/* AI verdict */}
                {row.aiVerdict && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${
                    aiDiverges ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                  }`}>
                    <span className="text-gray-400">AI verdict:</span>
                    <span className={`font-semibold capitalize ${
                      row.aiVerdict === 'approve' ? 'text-green-700' :
                      row.aiVerdict === 'reject' ? 'text-red-700' : 'text-gray-500'
                    }`}>{row.aiVerdict}</span>
                    {row.aiConfidence !== null && (
                      <span className="text-gray-400">({Math.round((row.aiConfidence || 0) * 100)}%)</span>
                    )}
                    {aiDiverges && (
                      <span className="ml-auto text-amber-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Diverged
                      </span>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
