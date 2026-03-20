import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Leaf, Shield, Coins, Users, Star, ArrowRight, Store, TreePine, Recycle } from 'lucide-react';
import ENBLeaf from '@/components/ENBLeaf';

const tiers = [
  { name: 'Newcomer 🌱', range: '0 – 4,999 Rep', perks: 'Earn ENB, spend at partner businesses' },
  { name: 'Helper 🌿', range: '5,000 – 19,999 Rep', perks: 'Verified directory listing, submit action reports' },
  { name: 'Guardian 🌳', range: '20,000 – 49,999 Rep', perks: 'Priority listing, vouch for new members' },
  { name: 'Pillar ⭐', range: '50,000 – 99,999 Rep', perks: 'Governance voting, Maturation Bridge eligible' },
  { name: 'Founder 🏆', range: '100,000+ Rep', perks: 'Co-governance, carbon credit revenue share' },
];

const actions = [
  { icon: Recycle, label: 'Neighbourhood Cleanup', enb: '1,000 ENB' },
  { icon: TreePine, label: 'Tree Planting', enb: '2,000 ENB' },
  { icon: Users, label: 'Skill Workshop', enb: '1,500 ENB' },
  { icon: Leaf, label: 'Food Sharing', enb: '800–1,500 ENB' },
  { icon: Star, label: 'Verified Trade Job', enb: '1,000 ENB' },
  { icon: Shield, label: 'Report Infrastructure Fault', enb: '300 ENB' },
];

const partners = [
  { emoji: '☕', name: 'Dhaba / Tea Stall', benefit: 'Free meals & discounts' },
  { emoji: '🛒', name: 'Grocery Store', benefit: '10–15% off essentials' },
  { emoji: '💊', name: 'Pharmacy', benefit: 'Discounts on medicines' },
  { emoji: '🔧', name: 'Auto Garage', benefit: '15% off labour charges' },
  { emoji: '✂️', name: 'Barber / Salon', benefit: '20% off haircuts' },
  { emoji: '🏫', name: 'School / Tuition', benefit: 'Fee contributions' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-enb-green px-4 pt-12 pb-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-lg mx-auto">
          <Link to="/" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/10 p-3 rounded-2xl">
              <ENBLeaf size={36} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">What is ENB?</h1>
              <p className="text-white/70 text-sm">Eco-Neighbor Token</p>
            </div>
          </div>
          <p className="text-white/90 text-base leading-relaxed">
            ENB rewards daily-wage workers, tradespeople, street vendors, and volunteers for verified civic and eco-friendly actions — redeemable at local partner businesses.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-10">

        {/* How it works */}
        <section>
          <h2 className="text-xl font-bold text-enb-text-primary mb-4">How It Works</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { step: '1', icon: '✅', title: 'Do Good', desc: 'Clean streets, plant trees, share food, teach skills' },
              { step: '2', icon: '📸', title: 'Get Verified', desc: 'Submit photo proof via the app with GPS location' },
              { step: '3', icon: '🪙', title: 'Earn ENB', desc: 'ENB.LOCAL tokens credited to your wallet instantly' },
              { step: '4', icon: '🛒', title: 'Spend Locally', desc: 'Redeem at partner dhabas, shops, pharmacies & more' },
            ].map(item => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Number(item.step) * 0.1 }}
                className="bg-enb-green/5 border border-enb-green/10 rounded-2xl p-4"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-bold text-sm text-enb-text-primary">{item.title}</div>
                <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* What you can earn */}
        <section>
          <h2 className="text-xl font-bold text-enb-text-primary mb-1">What You Can Earn</h2>
          <p className="text-sm text-gray-500 mb-4">ENB is awarded for verified civic and eco actions</p>
          <div className="space-y-2">
            {actions.map((action) => (
              <div key={action.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-enb-green/10 rounded-lg flex items-center justify-center">
                    <action.icon className="w-4 h-4 text-enb-green" />
                  </div>
                  <span className="text-sm font-medium text-enb-text-primary">{action.label}</span>
                </div>
                <span className="text-sm font-bold text-enb-green">{action.enb}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Where you can spend */}
        <section>
          <h2 className="text-xl font-bold text-enb-text-primary mb-1">Where You Can Spend</h2>
          <p className="text-sm text-gray-500 mb-4">Redeem ENB at local partner businesses in your neighbourhood</p>
          <div className="grid grid-cols-2 gap-3">
            {partners.map((p) => (
              <div key={p.name} className="bg-gray-50 rounded-2xl p-4">
                <div className="text-2xl mb-2">{p.emoji}</div>
                <div className="font-semibold text-sm text-enb-text-primary">{p.name}</div>
                <div className="text-xs text-gray-500 mt-1">{p.benefit}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Reputation tiers */}
        <section>
          <h2 className="text-xl font-bold text-enb-text-primary mb-1">Reputation Tiers</h2>
          <p className="text-sm text-gray-500 mb-4">The more you contribute, the more privileges you earn</p>
          <div className="space-y-2">
            {tiers.map((tier) => (
              <div key={tier.name} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-enb-text-primary">{tier.name}</div>
                  <div className="text-xs text-enb-green font-medium">{tier.range}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{tier.perks}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Two layers */}
        <section>
          <h2 className="text-xl font-bold text-enb-text-primary mb-4">Two Types of ENB</h2>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-enb-green/5 border border-enb-green/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-enb-green" />
                <span className="font-bold text-enb-green">ENB.LOCAL</span>
              </div>
              <p className="text-sm text-gray-600">Earned through civic actions. Spent at partner businesses. Like airline miles — earn and spend, cannot sell. Value is always stable.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-amber-700">ENB.GLOBAL</span>
              </div>
              <p className="text-sm text-gray-600">Accessible after 365 days of consistent contribution. Freely tradeable. For long-term community members who've proven their commitment.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="pb-8">
          <Link to="/signup/step1">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full bg-enb-green text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 group"
            >
              Join the Community
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          <Link to="/login">
            <button className="w-full mt-3 py-3 text-sm font-medium text-gray-500 hover:text-enb-green transition-colors">
              Already have an account? Log In
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
