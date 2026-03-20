import { useEffect, useState } from 'react';
import { Shield, ArrowDownLeft, RefreshCw, Leaf, Gift, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

interface Transaction {
  id: string;
  type: string;
  enb_amount: number;
  rep_change: number;
  description: string;
  created_at: string;
}

export default function TransactionHistory() {
  const { user } = useUserStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('id, type, enb_amount, rep_change, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchTransactions();

    // Real-time subscription — new transactions appear instantly
    const channel = supabase
      .channel(`transactions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setTransactions(prev => [payload.new as Transaction, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const displayed = showAll ? transactions : transactions.slice(0, 4);

  const getIcon = (type: string) => {
    if (type === 'MODERATOR_REWARD') return Shield;
    if (type === 'REFERRAL_REWARD') return Users;
    if (type === 'bridge') return RefreshCw;
    if (type === 'spend') return ArrowDownLeft;
    if (type === 'earn') return Leaf;
    return Gift;
  };

  const getColors = (type: string) => {
    if (type === 'MODERATOR_REWARD') return { color: 'text-blue-600', bg: 'bg-blue-50' };
    if (type === 'REFERRAL_REWARD') return { color: 'text-purple-600', bg: 'bg-purple-50' };
    if (type === 'bridge') return { color: 'text-enb-gold', bg: 'bg-enb-gold/10' };
    if (type === 'spend') return { color: 'text-red-500', bg: 'bg-red-50' };
    return { color: 'text-enb-green', bg: 'bg-enb-green/10' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-enb-text-primary">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-enb-green border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-enb-text-primary">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-enb-text-secondary text-sm">No transactions yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayed.map((tx) => {
              const Icon = getIcon(tx.type);
              const { color, bg } = getColors(tx.type);
              return (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-enb-text-primary">{tx.description}</div>
                      <div className="text-xs text-enb-text-secondary">{formatDate(tx.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${tx.enb_amount >= 0 ? 'text-enb-green' : 'text-red-500'}`}>
                      {tx.enb_amount >= 0 ? '+' : ''}{tx.enb_amount.toLocaleString()} ENB
                    </div>
                    {tx.rep_change !== 0 && (
                      <div className="text-xs text-enb-gold">
                        {tx.rep_change > 0 ? '+' : ''}{tx.rep_change} Rep
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {transactions.length > 4 && (
          <div className="p-4 text-center border-t border-gray-100">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-enb-green font-medium hover:underline"
            >
              {showAll ? 'Show Less' : `View All ${transactions.length} Transactions`}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
