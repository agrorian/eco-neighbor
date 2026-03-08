import { useState } from 'react';
import { ArrowRightLeft, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const REQUESTS = [
  { id: 1, user: 'Sarah J.', amount: 5000, wallet: '0x123...abc', status: 'Pending', tier: 'Pillar', holdProof: true },
  { id: 2, user: 'Mike T.', amount: 150000, wallet: '0x456...def', status: 'Pending', tier: 'Forest', holdProof: true },
  { id: 3, user: 'David R.', amount: 600000, wallet: '0x789...ghi', status: 'Pending', tier: 'Grove', holdProof: false },
];

export default function BridgeManager() {
  const [requests, setRequests] = useState(REQUESTS);

  const handleApprove = (id: number) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
  };

  const handleReject = (id: number) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Bridge Requests</h1>
          <p className="text-sm text-enb-text-secondary">Manage ENB to SOL conversions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Filter by Status</Button>
          <Button variant="outline" size="sm">Sort by Amount</Button>
        </div>
      </header>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-enb-teal/10 rounded-full flex items-center justify-center text-enb-teal font-bold text-lg">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-enb-text-primary text-lg">{request.user}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">{request.tier}</span>
                    <span className="font-mono text-xs text-gray-400">{request.wallet}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Amount</div>
                  <div className="font-bold text-enb-text-primary text-lg">{request.amount.toLocaleString()} ENB</div>
                </div>
                
                <div className="flex gap-2 items-center">
                  {request.status === 'Pending' ? (
                    <>
                      {request.amount > 500000 ? (
                        <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Initiate Vote
                        </Button>
                      ) : (
                        <Button onClick={() => handleApprove(request.id)} className="bg-green-600 hover:bg-green-700 text-white">
                          Approve
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => handleReject(request.id)} className="text-red-600 border-red-200 hover:bg-red-50">
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Badge variant={request.status === 'Approved' ? 'default' : 'destructive'} className={request.status === 'Approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}>
                      {request.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
