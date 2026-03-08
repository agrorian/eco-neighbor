import { useState } from 'react';
import { Store, CheckCircle, XCircle, MoreVertical, FileText, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const PARTNERS = [
  { id: 1, name: 'Green Leaf Cafe', category: 'Food', status: 'Active', float: 5000, redeemed: 1200, contact: 'manager@greenleaf.com' },
  { id: 2, name: 'Eco Cycle Shop', category: 'Retail', status: 'Pending', float: 2000, redeemed: 0, contact: 'owner@ecocycle.com' },
  { id: 3, name: 'Community Garden', category: 'Services', status: 'Active', float: 10000, redeemed: 4500, contact: 'info@garden.org' },
];

export default function PartnerManager() {
  const [partners, setPartners] = useState(PARTNERS);

  const handleApprove = (id: number) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status: 'Active' } : p));
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Partner Manager</h1>
          <p className="text-sm text-enb-text-secondary">Manage business relationships</p>
        </div>
        <Button className="bg-enb-green hover:bg-enb-green/90 text-white shadow-md shadow-enb-green/20">
          <Store className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </header>

      <div className="grid gap-4">
        {partners.map((partner) => (
          <Card key={partner.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                  {partner.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-enb-text-primary text-lg">{partner.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">{partner.category}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      partner.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {partner.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Monthly Float</div>
                  <div className="font-bold text-enb-text-primary">{partner.float} ENB</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Redeemed</div>
                  <div className="font-bold text-enb-green">{partner.redeemed} ENB</div>
                </div>
                
                <div className="flex gap-2">
                  {partner.status === 'Pending' && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(partner.id)} className="bg-green-600 hover:bg-green-700 text-white">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        Reject
                      </Button>
                    </>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <FileText className="w-4 h-4 mr-2" /> View Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" /> Contact Partner
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <XCircle className="w-4 h-4 mr-2" /> Suspend Partner
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
