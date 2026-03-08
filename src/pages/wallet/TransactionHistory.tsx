import { useEffect, useState } from 'react';
import { ArrowDownLeft, RefreshCw, ShoppingBag, Leaf, Loader2 } from 'lucide-react';
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

function getIcon(type: string) {
  if (type === 'submission') return { icon: Leaf, color: 'text-enb-green', bg: 'bg-enb-green/10' };
  if (type === 'redemption') return { icon: ShoppingBag, color: 'text-red-500', bg: 'bg-red-50' };
  if (type === 'bridge') return { icon: RefreshCw, color: 'text-enb-gold', bg: 'bg-enb-gold/10' };
  return { icon: ArrowDownLeft, color: 'text-blue-500', bg: 'bg-blue-50' };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diff < 172800000) return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TransactionHistory() {
  const { user } = useUserStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(showAll ? 50 : 5);
      if (!error && data) setTransactions(data);
      setLoading(false);
    };
    fetchTransactions();
  }, [user, showAll]);

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-enb-text-primary">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No transactions yet. Submit your first action to get started!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => {
              const { icon: Icon, color, bg } = getIcon(tx.type);
              const isPositive = tx.enb_amount >= 0;
              return (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-enb-text-primary capitalize text-sm">
                        {tx.description || tx.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-enb-text-secondary">{formatDate(tx.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${isPositive ? 'text-enb-green' : 'text-enb-text-primary'}`}>
                      {isPositive ? '+' : ''}{tx.enb_amount.toLocaleString()} ENB
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
        {!loading && transactions.length > 0 && (
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
