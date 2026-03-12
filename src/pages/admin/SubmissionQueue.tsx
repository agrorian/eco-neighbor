import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, MapPin, Loader2, RefreshCw, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface Submission {
  id: string;
  user_id: string;
  action_type: string;
  description: string;
  photo_urls: string[];
  gps_address: string | null;
  status: string;
  enb_awarded: number;
  rep_awarded: number;
  submitted_at: string;
  submitter_name?: string;
  submitter_whatsapp?: string;
}

export default function SubmissionQueue() {
  const { user } = useUserStore();
  const [queue, setQueue] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [lastApproved, setLastApproved] = useState<{ name: string; whatsapp: string | null; enb: number } | null>(null);
  const [fetchError, setFetchError] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    setFetchError('');
    try {
      // Step 1: Get ALL submission IDs already assigned to mods (any stage)
      // Admin queue only shows fresh submissions not yet assigned to any moderator.
      // Mod-assigned submissions belong to ModQueue (pending decisions) or
      // EscalationQueue (disagreement) — not here.
      const { data: assigned } = await supabase
        .from('moderator_assignments')
        .select('submission_id');
      const assignedIds = (assigned || []).map((e: any) => e.submission_id).filter(Boolean);

      // Step 2: fetch pending submissions excluding all mod-assigned ones
      let query = supabase
        .from('submissions')
        .select('id, user_id, action_type, description, photo_urls, gps_address, status, enb_awarded, rep_awarded, submitted_at')
        .eq('status', 'pending');
      if (assignedIds.length > 0) {
        query = query.not('id', 'in', `(${assignedIds.map((id: string) => `"${id}"`).join(',')})`);
      }
      const { data: subs, error: subError } = await query
        .order('submitted_at', { ascending: true });

      if (subError) {
        console.error('Submissions fetch error:', subError);
        setFetchError(subError.message);
        setLoading(false);
        return;
      }

      if (!subs || subs.length === 0) {
        setQueue([]);
        setLoading(false);
        return;
      }

      // Step 2: fetch user details separately to avoid join issues
      const userIds = [...new Set(subs.map(s => s.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email, whatsapp_number')
        .in('id', userIds);

      const userMap = new Map((users || []).map(u => [u.id, u]));

      // Step 3: combine
      const enriched = subs.map(s => {
        const u = userMap.get(s.user_id);
        return {
          ...s,
          submitter_name: u?.full_name || u?.email || 'Unknown Member',
          submitter_whatsapp: u?.whatsapp_number || null,
        };
      });

      setQueue(enriched);
    } catch (err: any) {
      console.error('Queue fetch exception:', err);
      setFetchError(err.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleApprove = async (item: Submission) => {
    if (!user) return;
    setProcessing(item.id);
    try {
      const { data, error } = await supabase.rpc('approve_submission', {
        p_submission_id: item.id,
        p_moderator_id: user.id,
        p_enb_amount: item.enb_awarded,
        p_rep_amount: item.rep_awarded,
        p_note: null,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Approval failed');

      setLastApproved({ name: item.submitter_name!, whatsapp: item.submitter_whatsapp || null, enb: item.enb_awarded });
      setQueue(prev => prev.filter(s => s.id !== item.id));
      setSelectedItem(null);
    } catch (err: any) {
      alert('Failed to approve: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (item: Submission) => {
    if (!rejectReason || !user) return;
    setProcessing(item.id);
    try {
      const { data, error } = await supabase.rpc('reject_submission', {
        p_submission_id: item.id,
        p_moderator_id: user.id,
        p_reason: rejectReason,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Rejection failed');
      setQueue(prev => prev.filter(s => s.id !== item.id));
      setSelectedItem(null);
      setRejectReason('');
    } catch (err: any) {
      alert('Failed to reject: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const sendWhatsApp = (name: string, whatsapp: string, enb: number) => {
    const msg = encodeURIComponent(
      `✅ Assalam-o-Alaikum ${name}!\n\nYour ENB action has been approved! 🌿\n+${enb.toLocaleString()} ENB credited to your wallet.\n\nKeep it up!\n— ENB Team`
    );
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Review Queue</h1>
          <p className="text-sm text-enb-text-secondary">{queue.length} pending submission{queue.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchQueue} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {/* Error banner */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          ⚠️ Error loading queue: {fetchError}
        </div>
      )}

      {/* WhatsApp notify banner */}
      {lastApproved && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-green-700">✅ Approved — {lastApproved.name}</p>
            <p className="text-xs text-green-600">+{lastApproved.enb.toLocaleString()} ENB credited</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {lastApproved.whatsapp && (
              <Button size="sm" onClick={() => sendWhatsApp(lastApproved.name, lastApproved.whatsapp!, lastApproved.enb)}
                className="bg-green-500 hover:bg-green-600 text-white text-xs">
                <MessageCircle className="w-3 h-3 mr-1" />Notify
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setLastApproved(null)} className="text-xs text-gray-400">✕</Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />Loading queue...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queue.map((item) => {
            const isProcessing = processing === item.id;
            const photoUrl = item.photo_urls?.[0] || null;
            return (
              <motion.div key={item.id} layoutId={`card-${item.id}`}>
                <Card className={`overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow ${selectedItem === item.id ? 'ring-2 ring-enb-green' : ''}`}>
                  {photoUrl ? (
                    <div className="relative h-48">
                      <img src={photoUrl} alt={item.action_type} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 bg-gradient-to-br from-enb-green/10 to-enb-teal/10 flex items-center justify-center">
                      <span className="text-3xl">{getActionEmoji(item.action_type)}</span>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-enb-text-primary capitalize">{item.action_type.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-enb-text-secondary flex items-center gap-1">
                          <User className="w-3 h-3" />{item.submitter_name}
                        </p>
                      </div>
                      {item.gps_address && (
                        <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          <MapPin className="w-3 h-3 mr-1" />GPS ✓
                        </div>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex gap-2 mb-4">
                      <span className="text-xs font-medium text-enb-green bg-enb-green/5 px-2 py-0.5 rounded-full">+{item.enb_awarded.toLocaleString()} ENB</span>
                      <span className="text-xs font-medium text-enb-gold bg-enb-gold/5 px-2 py-0.5 rounded-full">+{item.rep_awarded} Rep</span>
                      <span className="text-xs text-gray-400 ml-auto">{new Date(item.submitted_at).toLocaleDateString()}</span>
                    </div>

                    {selectedItem === item.id ? (
                      <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                        <Button onClick={() => handleApprove(item)} disabled={isProcessing}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm">
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : `✓ Approve (+${item.enb_awarded.toLocaleString()} ENB)`}
                        </Button>
                        <Input placeholder="Rejection reason (required)..." value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)} className="text-sm" />
                        <Button onClick={() => handleReject(item)} disabled={!rejectReason || isProcessing}
                          className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-sm">
                          ✗ Reject
                        </Button>
                        <Button variant="ghost" onClick={() => { setSelectedItem(null); setRejectReason(''); }}
                          className="w-full text-xs text-gray-400">Cancel</Button>
                      </div>
                    ) : (
                      <Button onClick={() => setSelectedItem(item.id)}
                        className="w-full bg-enb-green hover:bg-enb-green/90 text-white shadow-sm text-sm">
                        Review Submission
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {queue.length === 0 && !loading && !fetchError && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-20" />
              <p className="font-medium">All caught up! No pending submissions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getActionEmoji(actionType: string): string {
  const map: Record<string, string> = {
    neighbourhood_cleanup: '🧹', recycling_dropoff: '♻️', carpool: '🚗',
    food_sharing: '🍲', skill_workshop: '🛠️', infrastructure_report: '🏗️',
    trade_job: '⚒️', youth_mentoring: '📚', tree_planting: '🌳', waste_reporting: '🗑️',
  };
  return map[actionType] || '🌿';
}
