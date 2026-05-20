import { useState, useEffect } from 'react';
import { Shield, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2, ExternalLink, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

const ALL_VEHICLE_TYPES = ['Bike', 'Rickshaw', 'Auto-rickshaw', 'Car', 'Van/Minivan', 'Bus/Coaster'];

const LICENSE_MAP: Record<string, string[]> = {
  motorcycle: ['Bike'],
  ltv: ['Car', 'Rickshaw', 'Auto-rickshaw'],
  htv: ['Van/Minivan', 'Bus/Coaster'],
};

interface CaptainApp {
  id: string;
  user_id: string;
  status: string;
  license_categories: string[];
  approved_vehicle_types: string[];
  cnic_front_url: string | null;
  cnic_back_url: string | null;
  license_front_url: string | null;
  vehicle_description: string | null;
  motivation: string | null;
  admin_note: string | null;
  applied_at: string;
  reviewed_at: string | null;
  applicant_name?: string;
  applicant_email?: string;
  rep_score?: number;
}

export default function AdminCaptains() {
  const { user } = useUserStore();
  const [apps, setApps] = useState<CaptainApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('captain_applications')
      .select('*')
      .order('applied_at', { ascending: false });

    if (data && data.length > 0) {
      const userIds = data.map(a => a.user_id);
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email, rep_score')
        .in('id', userIds);
      const userMap = new Map((users || []).map(u => [u.id, u]));
      setApps(data.map(a => ({
        ...a,
        applicant_name: userMap.get(a.user_id)?.full_name || 'Unknown',
        applicant_email: userMap.get(a.user_id)?.email || '',
        rep_score: userMap.get(a.user_id)?.rep_score || 0,
      })));
    } else {
      setApps([]);
    }
    setLoading(false);
  };

  const handleExpand = (app: CaptainApp) => {
    if (expandedId === app.id) {
      setExpandedId(null);
    } else {
      setExpandedId(app.id);
      setAdminNote(app.admin_note || '');
      // Pre-select vehicles based on license categories
      const suggested = app.license_categories.flatMap(c => LICENSE_MAP[c] || []);
      setSelectedVehicles(app.approved_vehicle_types?.length > 0 ? app.approved_vehicle_types : suggested);
    }
  };

  const handleApprove = async (app: CaptainApp) => {
    if (selectedVehicles.length === 0) { alert('Select at least one vehicle type to approve.'); return; }
    setSaving(app.id);
    await supabase
      .from('captain_applications')
      .update({
        status: 'approved',
        approved_vehicle_types: selectedVehicles,
        admin_note: adminNote || null,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', app.id);
    setSaving(null);
    setExpandedId(null);
    fetchApps();
  };

  const handleReject = async (app: CaptainApp) => {
    if (!adminNote.trim()) { alert('Please add a reason for rejection.'); return; }
    setSaving(app.id);
    await supabase
      .from('captain_applications')
      .update({
        status: 'rejected',
        admin_note: adminNote,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', app.id);
    setSaving(null);
    setExpandedId(null);
    fetchApps();
  };

  const handleSuspend = async (app: CaptainApp) => {
    if (!adminNote.trim()) { alert('Please add a reason for suspension.'); return; }
    setSaving(app.id);
    await supabase
      .from('captain_applications')
      .update({
        status: 'suspended',
        admin_note: adminNote,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', app.id);
    // Also revoke rider status
    await getDb().from('users').update({ is_carpool_rider: false }).eq('id', app.user_id);
    setSaving(null);
    setExpandedId(null);
    fetchApps();
  };

  const filtered = apps.filter(a => filter === 'all' || a.status === filter);
  const pendingCount = apps.filter(a => a.status === 'pending').length;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-enb-green/10 text-enb-green',
      rejected: 'bg-red-100 text-red-600',
      suspended: 'bg-gray-100 text-gray-600',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-enb-green" />
          <h1 className="text-2xl font-bold text-enb-text-primary">ENB Captains</h1>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-sm text-enb-text-secondary mt-1">
          Review and manage Carpool Captain applications
        </p>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['pending', 'approved', 'rejected', 'suspended', 'all'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === s ? 'bg-enb-green text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <span className="ml-1">({apps.filter(a => a.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-enb-green" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-gray-100">
          <CardContent className="p-8 text-center text-enb-text-secondary">
            No {filter === 'all' ? '' : filter} applications
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <Card key={app.id} className={`border overflow-hidden ${
              app.status === 'pending' ? 'border-amber-200' : 'border-gray-100'
            }`}>
              {/* Summary row */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleExpand(app)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-enb-green text-white flex items-center justify-center font-bold shrink-0">
                      {(app.applicant_name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-enb-text-primary">{app.applicant_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {app.applicant_email} · {app.rep_score?.toLocaleString()} Rep
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Applied {new Date(app.applied_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  {expandedId === app.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === app.id && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                  {/* License categories */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">LICENSE CATEGORIES</p>
                    <div className="flex gap-2 flex-wrap">
                      {(app.license_categories || []).map(c => (
                        <span key={c} className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-enb-text-primary">
                          {c.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">DOCUMENTS</p>
                    <div className="flex gap-2 flex-wrap">
                      {app.cnic_front_url && (
                        <a href={app.cnic_front_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-enb-green hover:border-enb-green">
                          <ExternalLink className="w-3 h-3" /> CNIC Front
                        </a>
                      )}
                      {app.cnic_back_url && (
                        <a href={app.cnic_back_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-enb-green hover:border-enb-green">
                          <ExternalLink className="w-3 h-3" /> CNIC Back
                        </a>
                      )}
                      {app.license_front_url && (
                        <a href={app.license_front_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-enb-green hover:border-enb-green">
                          <ExternalLink className="w-3 h-3" /> Driving License
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Vehicle description */}
                  {app.vehicle_description && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">VEHICLE</p>
                      <p className="text-sm text-enb-text-primary">{app.vehicle_description}</p>
                    </div>
                  )}

                  {/* Motivation */}
                  {app.motivation && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">MOTIVATION</p>
                      <p className="text-sm text-enb-text-secondary">{app.motivation}</p>
                    </div>
                  )}

                  {/* Vehicle type approval selector */}
                  {(app.status === 'pending' || app.status === 'approved') && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">APPROVE VEHICLE TYPES</p>
                      <div className="flex flex-wrap gap-2">
                        {ALL_VEHICLE_TYPES.map(v => (
                          <button
                            key={v}
                            onClick={() => setSelectedVehicles(prev =>
                              prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
                            )}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              selectedVehicles.includes(v)
                                ? 'bg-enb-green text-white border-enb-green'
                                : 'bg-white border-gray-200 text-enb-text-primary'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin note */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      {app.status === 'pending' ? 'NOTE (required for rejection)' : 'ADMIN NOTE'}
                    </p>
                    <textarea
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      placeholder="Add a note..."
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none h-16 bg-white focus:outline-none focus:border-enb-green"
                    />
                  </div>

                  {/* Action buttons */}
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(app)}
                        disabled={saving === app.id}
                        className="flex-1 bg-enb-green hover:bg-enb-green/90 text-white"
                      >
                        {saving === app.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <><CheckCircle className="w-4 h-4 mr-1.5" /> Approve</>}
                      </Button>
                      <Button
                        onClick={() => handleReject(app)}
                        disabled={saving === app.id}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  )}

                  {app.status === 'approved' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(app)}
                        disabled={saving === app.id}
                        className="flex-1 bg-enb-green hover:bg-enb-green/90 text-white text-sm"
                      >
                        Update Vehicle Types
                      </Button>
                      <Button
                        onClick={() => handleSuspend(app)}
                        disabled={saving === app.id}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-sm"
                      >
                        Suspend Captain
                      </Button>
                    </div>
                  )}

                  {app.status === 'rejected' && (
                    <Button
                      onClick={() => handleApprove(app)}
                      disabled={saving === app.id}
                      className="w-full bg-enb-green hover:bg-enb-green/90 text-white"
                    >
                      Approve on Reapplication
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
