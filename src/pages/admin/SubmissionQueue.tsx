import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

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
  users?: { full_name: string | null; email: string | null };
}

export default function SubmissionQueue() {
  const [queue, setQueue] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('id, user_id, action_type, description, photo_urls, gps_address, status, enb_awarded, rep_awarded, submitted_at')
      .eq('status', 'pending');
    if (error) {
      console.error('Queue fetch error:', error);
    }
    if (data) setQueue(data as Submission[]);
    setLoading(false);
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleApprove = async (item: Submission) => {
    setProcessing(item.id);
    try {
      // Update submission status
      await supabase.from('submissions').update({ status: 'approved' }).eq('id', item.id);

      // Credit ENB and Rep to user
      const { data: userData } = await supabase
        .from('users')
        .select('enb_local_bal, rep_score')
        .eq('id', item.user_id)
        .single();

      if (userData) {
        await supabase.from('users').update({
          enb_local_bal: (userData.enb_local_bal ?? 0) + item.enb_awarded,
          rep_score: (userData.rep_score ?? 0) + item.rep_awarded,
        }).eq('id', item.user_id);
      }

      // Log transaction
      await supabase.from('transactions').insert({
        user_id: item.user_id,
        type: 'approval',
        enb_amount: item.enb_awarded,
        rep_change: item.rep_awarded,
        description: `Approved: ${item.action_type.replace(/_/g, ' ')}`,
      });

      setQueue(prev => prev.filter(s => s.id !== item.id));
      setSelectedItem(null);
    } catch (err) {
      console.error('Approve failed:', err);
      alert('Failed to approve. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (item: Submission) => {
    if (!rejectReason) return;
    setProcessing(item.id);
    try {
      await supabase.from('submissions').update({
        status: 'rejected',
        rejection_reason: rejectReason,
      }).eq('id', item.id);
      setQueue(prev => prev.filter(s => s.id !== item.id));
      setSelectedItem(null);
      setRejectReason('');
    } catch (err) {
      console.error('Reject failed:', err);
      alert('Failed to reject. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Review Queue</h1>
          <p className="text-sm text-enb-text-secondary">{queue.length} pending submissions</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchQueue} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading queue...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queue.map((item) => {
            const submitterName = item.users?.full_name || item.users?.email || 'Unknown User';
            const photoUrl = item.photo_urls?.[0] || null;
            const isProcessing = processing === item.id;

            return (
              <motion.div key={item.id} layoutId={`card-${item.id}`}>
                <Card className={`overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow ${selectedItem === item.id ? 'ring-2 ring-enb-green' : ''}`}>
                  {photoUrl && (
                    <div className="relative h-48">
                      <img src={photoUrl} alt={item.action_type} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-enb-text-primary capitalize">{item.action_type.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-enb-text-secondary">by {submitterName}</p>
                      </div>
                      {item.gps_address && (
                        <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          <MapPin className="w-3 h-3 mr-1" />
                          GPS ✓
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex gap-2 mb-4">
                      <span className="text-xs font-medium text-enb-green bg-enb-green/5 px-2 py-0.5 rounded-full">+{item.enb_awarded.toLocaleString()} ENB</span>
                      <span className="text-xs font-medium text-enb-gold bg-enb-gold/5 px-2 py-0.5 rounded-full">+{item.rep_awarded} Rep</span>
                    </div>

                    {selectedItem === item.id ? (
                      <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(item)}
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Approve (+${item.enb_awarded.toLocaleString()} ENB)`}
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedItem(null)} className="text-gray-500">Cancel</Button>
                        </div>
                        <Input
                          placeholder="Reason for rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="text-sm"
                        />
                        <Button
                          onClick={() => handleReject(item)}
                          disabled={!rejectReason || isProcessing}
                          variant="destructive"
                          className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        >
                          Reject Submission
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={() => handleApprove(item)} disabled={isProcessing} className="flex-1 bg-enb-green hover:bg-enb-green/90 text-white shadow-sm text-sm">
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" />Approve</>}
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedItem(item.id)} className="px-3 text-red-500 border-red-100 hover:bg-red-50">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {queue.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-20" />
              <p>All caught up! No pending submissions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
