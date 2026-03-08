import { motion } from 'motion/react';
import { CheckCircle, Share2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const ACTION_REWARDS: Record<string, { enb: number; rep: number }> = {
  neighbourhood_cleanup:  { enb: 1000, rep: 500 },
  recycling_dropoff:      { enb: 500,  rep: 200 },
  carpool:                { enb: 300,  rep: 100 },
  food_sharing:           { enb: 800,  rep: 300 },
  skill_workshop:         { enb: 1500, rep: 1000 },
  infrastructure_report:  { enb: 300,  rep: 100 },
  trade_job:              { enb: 1000, rep: 800 },
  youth_mentoring:        { enb: 2000, rep: 1500 },
  tree_planting:          { enb: 2000, rep: 1200 },
  waste_reporting:        { enb: 500,  rep: 200 },
};

interface SubmissionSuccessProps {
  actionType?: string;
}

export default function SubmissionSuccess({ actionType }: SubmissionSuccessProps) {
  const rewards = actionType ? ACTION_REWARDS[actionType] : null;
  const enbReward = rewards?.enb ?? 0;
  const repReward = rewards?.rep ?? 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="w-24 h-24 bg-enb-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-enb-green" />
        </div>
      </motion.div>

      <h1 className="text-3xl font-bold text-enb-text-primary mb-2">Submission Received!</h1>
      <p className="text-enb-text-secondary max-w-xs mx-auto">
        Your action has been submitted for verification. You'll receive your tokens once an admin approves it (usually within 24 hours).
      </p>

      <Card className="w-full max-w-sm bg-white border-gray-100 shadow-sm mt-8">
        <CardContent className="p-6 text-center space-y-4">
          <div className="text-sm font-medium text-enb-text-secondary uppercase tracking-wider">Pending Reward</div>
          <div className="text-4xl font-bold text-enb-gold flex items-center justify-center gap-2">
            +{enbReward.toLocaleString()} <span className="text-2xl opacity-80 font-medium">ENB</span>
          </div>
          {repReward > 0 && (
            <div className="text-lg font-bold text-enb-green">
              +{repReward.toLocaleString()} Rep
            </div>
          )}
          <div className="text-xs text-gray-400">Pending Verification (Usually &lt; 24h)</div>
        </CardContent>
      </Card>

      <div className="flex gap-4 w-full max-w-sm mt-8">
        <Link to="/" className="flex-1">
          <Button variant="outline" className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </Link>
        <Button className="flex-1 bg-enb-green hover:bg-enb-green/90 text-white shadow-lg shadow-enb-green/20">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}
