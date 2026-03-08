import { motion } from 'motion/react';
import { Leaf, Recycle, Car, Apple, GraduationCap, AlertTriangle, Wrench, Heart, TreePine, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ActionSelectorProps {
  onSelect: (action: string) => void;
}

const actions = [
  {
    id: 'neighbourhood_cleanup',
    title: 'Neighbourhood Cleanup',
    description: 'Clean up litter in public spaces',
    icon: Leaf,
    color: 'text-enb-green',
    bg: 'bg-enb-green/10',
    enb: 1000,
    rep: 500,
  },
  {
    id: 'recycling_dropoff',
    title: 'Recycling Drop-off',
    description: 'Drop off recyclables at verified centres',
    icon: Recycle,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    enb: 500,
    rep: 200,
  },
  {
    id: 'carpool',
    title: 'Carpool',
    description: 'Share a ride to reduce emissions',
    icon: Car,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
    enb: 300,
    rep: 100,
  },
  {
    id: 'food_sharing',
    title: 'Food Sharing',
    description: 'Share surplus food with neighbours',
    icon: Apple,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    enb: 800,
    rep: 300,
  },
  {
    id: 'skill_workshop',
    title: 'Skill Workshop',
    description: 'Teach a skill to community members',
    icon: GraduationCap,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    enb: 1500,
    rep: 1000,
  },
  {
    id: 'infrastructure_report',
    title: 'Infrastructure Report',
    description: 'Report a local infrastructure issue',
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    enb: 300,
    rep: 100,
  },
  {
    id: 'trade_job',
    title: 'Trade Job',
    description: 'Provide a skilled trade service',
    icon: Wrench,
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    enb: 1000,
    rep: 800,
  },
  {
    id: 'youth_mentoring',
    title: 'Youth Mentoring',
    description: 'Mentor a young community member',
    icon: Heart,
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    enb: 2000,
    rep: 1500,
  },
  {
    id: 'tree_planting',
    title: 'Tree Planting',
    description: 'Plant trees in the neighbourhood',
    icon: TreePine,
    color: 'text-enb-green',
    bg: 'bg-enb-green/10',
    enb: 2000,
    rep: 1200,
  },
  {
    id: 'waste_reporting',
    title: 'Waste Reporting',
    description: 'Report illegal dumping or waste',
    icon: Trash2,
    color: 'text-red-500',
    bg: 'bg-red-50',
    enb: 500,
    rep: 200,
  },
];

export default function ActionSelector({ onSelect }: ActionSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-enb-text-primary mb-2">Select Action Type</h2>
      <div className="grid gap-4">
        {actions.map((action, i) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(action.id)}
            className="cursor-pointer"
          >
            <Card className="hover:border-enb-green/50 transition-colors border-gray-100 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.bg} ${action.color}`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-enb-text-primary">{action.title}</h3>
                    <p className="text-xs text-enb-text-secondary">{action.description}</p>
                    <div className="mt-1 flex gap-2">
                      <span className="inline-flex items-center text-xs font-medium text-enb-green bg-enb-green/5 px-2 py-0.5 rounded-full">
                        +{action.enb.toLocaleString()} ENB
                      </span>
                      <span className="inline-flex items-center text-xs font-medium text-enb-gold bg-enb-gold/5 px-2 py-0.5 rounded-full">
                        +{action.rep} Rep
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}