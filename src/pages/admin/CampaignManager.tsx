import { useState } from 'react';
import { Plus, Play, Pause, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CAMPAIGNS = [
  { id: 1, name: 'Summer Cleanup Drive', status: 'Active', multiplier: '2x', budget: '50,000 ENB', distributed: '12,500 ENB', participants: 450, ends: 'Aug 31' },
  { id: 2, name: 'Recycling Awareness Month', status: 'Paused', multiplier: '1.5x', budget: '20,000 ENB', distributed: '8,200 ENB', participants: 210, ends: 'Sep 15' },
  { id: 3, name: 'Tree Planting Initiative', status: 'Ended', multiplier: '3x', budget: '100,000 ENB', distributed: '98,000 ENB', participants: 1200, ends: 'Jun 30' },
];

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);
  const [newCampaign, setNewCampaign] = useState({ name: '', multiplier: '1.5x', budget: '' });

  const handleCreate = () => {
    setCampaigns([...campaigns, { 
      id: campaigns.length + 1, 
      name: newCampaign.name, 
      status: 'Active', 
      multiplier: newCampaign.multiplier, 
      budget: `${newCampaign.budget} ENB`, 
      distributed: '0 ENB', 
      participants: 0, 
      ends: 'TBD' 
    }]);
    setNewCampaign({ name: '', multiplier: '1.5x', budget: '' });
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Campaign Manager</h1>
          <p className="text-sm text-enb-text-secondary">Create and manage reward multipliers</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-enb-green hover:bg-enb-green/90 text-white shadow-md shadow-enb-green/20">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input 
                  value={newCampaign.name} 
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})} 
                  placeholder="e.g. Winter Warm-up" 
                />
              </div>
              <div className="space-y-2">
                <Label>Reward Multiplier</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={newCampaign.multiplier}
                  onChange={(e) => setNewCampaign({...newCampaign, multiplier: e.target.value})}
                >
                  <option value="1.5x">1.5x Bonus</option>
                  <option value="2x">2x Double Rewards</option>
                  <option value="3x">3x Triple Rewards</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Budget Cap (ENB)</Label>
                <Input 
                  type="number" 
                  value={newCampaign.budget} 
                  onChange={(e) => setNewCampaign({...newCampaign, budget: e.target.value})} 
                  placeholder="50000" 
                />
              </div>
              <Button onClick={handleCreate} className="w-full bg-enb-green text-white">Launch Campaign</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  campaign.status === 'Active' ? 'bg-green-100 text-green-600' : 
                  campaign.status === 'Paused' ? 'bg-orange-100 text-orange-600' : 
                  'bg-gray-100 text-gray-400'
                }`}>
                  {campaign.multiplier}
                </div>
                <div>
                  <h3 className="font-bold text-enb-text-primary text-lg">{campaign.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      campaign.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 
                      campaign.status === 'Paused' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 
                      'bg-gray-50 text-gray-600 border border-gray-100'
                    }`}>
                      {campaign.status}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Ends {campaign.ends}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {campaign.participants} participants
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex items-center gap-6">
                <div>
                  <div className="text-2xl font-bold text-enb-text-primary">{campaign.distributed}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">of {campaign.budget}</div>
                </div>
                <div className="flex gap-2">
                  {campaign.status === 'Active' ? (
                    <Button variant="outline" size="icon" className="text-orange-600 hover:bg-orange-50 border-orange-100">
                      <Pause className="w-4 h-4" />
                    </Button>
                  ) : campaign.status === 'Paused' ? (
                    <Button variant="outline" size="icon" className="text-green-600 hover:bg-green-50 border-green-100">
                      <Play className="w-4 h-4" />
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
