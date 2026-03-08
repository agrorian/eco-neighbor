import { motion } from 'motion/react';
import { Leaf, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-enb-surface flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-enb-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-enb-gold/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-enb-green p-6 rounded-3xl mb-8 shadow-xl shadow-enb-green/20 relative z-10"
      >
        <Leaf className="w-16 h-16 text-white" />
      </motion.div>
      
      <h1 className="text-4xl md:text-5xl font-bold text-enb-text-primary mb-4 tracking-tight">
        Earn ENB for Community Actions
      </h1>
      <p className="text-enb-text-secondary mb-12 max-w-md mx-auto text-lg leading-relaxed">
        Join the community, take action, and earn rewards for making a difference.
      </p>

      <div className="space-y-4 w-full max-w-sm relative z-10">
        <Link to="/signup/step1">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full bg-enb-green text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-enb-green/90 transition-all flex items-center justify-center gap-2 group"
          >
            Sign Up
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </Link>

        <Link to="/login">
          <button 
            className="w-full py-3 text-sm font-medium text-enb-text-secondary hover:text-enb-green hover:bg-enb-green/5 rounded-xl transition-colors"
          >
            Log In
          </button>
        </Link>
      </div>
      
      <div className="mt-8 text-xs text-gray-400">
        <Link to="/about" className="hover:text-enb-green underline">What is ENB?</Link>
      </div>
    </div>
  );
}
