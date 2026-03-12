import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/user';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { History, MapPin, AlertTriangle, CheckCircle, XCircle, Clock, Loader2, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Submission {
  id: string;
  action_type: string;
  description: string;
  status: string;
  enb_awarded: number;
  rep_awarded: number;
  submitted_at: string;
  photo_urls: string[];
  gps_address: string;
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  approved: { icon: CheckCircle, color: 'text-enb-green', bg: 'bg-enb-green/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
  pending: { icon: Clock, color: 'text-enb-gold', bg: 'bg-enb-gold/10', label: 'Pending Review' },
};

export default function MyHistory() {
  const { user } = useUserStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('submissions')
        .select('id, action_type, description, status, enb_awarded, rep_awarded, submitted_at, photo_urls, gps_address')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });
      setSubmissions(data || []);
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="space-y-5 pb-24">
      <header className="flex items-center gap-3 mb-2">
        <History className="w-6 h-6 text-enb-gold" />
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">My History</h1>
          <p className="text-sm text-enb-text-secondary">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} total</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-enb-green" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-400">No submissions yet</p>
          <p className="text-xs text-gray-400 mt-1">Your submitted actions will appear here</p>
          <Link to="/submit">
            <Button className="mt-4 bg-enb-green text-white">Submit Your First Action</Button>
          </Link>
        </div>
      ) : (
        submissions.map(sub => {
          const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
          const StatusIcon = cfg.icon;
          return (
            <Card key={sub.id} className="border-gray-100 shadow-sm overflow-hidden">
              {/* Photo */}
              {sub.photo_urls?.[0] ? (
                <div className="h-44 overflow-hidden bg-gray-100">
                  <img src={sub.photo_urls[0]} alt="submission" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-20 bg-gray-50 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-300" />
                </div>
              )}

              <CardContent className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-enb-text-primary capitalize text-base">
                      {sub.action_type?.replace(/_/g, ' ')}
                    </h3>
                    {sub.gps_address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{sub.gps_address}
                      </p>
                    )}
                  </div>
                  {/* Status badge */}
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                {/* Description */}
                {sub.description && (
                  <p className="text-sm text-enb-text-secondary line-clamp-2">{sub.description}</p>
                )}

                {/* Rewards row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    {new Date(sub.submitted_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {sub.status === 'approved' && (
                    <div className="flex gap-3">
                      <span className="font-bold text-enb-green">+{sub.enb_awarded?.toLocaleString() || 500} ENB</span>
                      <span className="font-bold text-enb-gold">+{sub.rep_awarded || 200} Rep</span>
                    </div>
                  )}
                  {sub.status === 'pending' && (
                    <span className="text-enb-gold font-medium">Awaiting review</span>
                  )}
                  {sub.status === 'rejected' && (
                    <span className="text-red-400 font-medium">Not approved</span>
                  )}
                </div>

                {/* Report This button — only on approved submissions (already verified real actions) */}
                {sub.status === 'approved' && (
                  <div className="pt-1 border-t border-gray-100">
                    <Link to={`/report?submission=${sub.id}&target=${user.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-orange-500 hover:bg-orange-50 hover:text-orange-600 text-xs font-medium"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                        Report a concern about this submission
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
