import { useEffect, useState } from 'react';
import { ArrowDownLeft, RefreshCw, Leaf } from 'lucide-react';
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

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('transactions')
        .select('id, type, enb_amount, rep_change, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setTransactions(data);
      setLoading(false);
    };
    fetchTransactions();
  }, [user?.id]);

  const displayed = showAll ? transactions : transactions.slice(0, 4);

  const getIcon = (type: string) => {
    if (type === 'bridge') return RefreshCw;
    if (type === 'spend') return ArrowDownLeft;
    return Leaf;
  };

  const getColors = (type: string) => {
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
    return date.toLocaleDateString();
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
                      {tx.enb_amount >= 0 ? '+' : ''}{tx.enb_amount} ENB
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
              {showAll ? 'Show Less' : 'View All Transactions'}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
