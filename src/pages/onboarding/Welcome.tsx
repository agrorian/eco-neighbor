import { motion } from 'motion/react';
import ENBLeaf from '@/components/ENBLeaf';
import { ArrowRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useT } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function Welcome() {
  const { l, isUrdu } = useT();

  return (
    <div className="min-h-screen bg-enb-surface flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-enb-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-enb-gold/5 rounded-full blur-3xl" />
      </div>

      {/* Language toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-enb-green p-6 rounded-3xl mb-8 shadow-xl shadow-enb-green/20 relative z-10"
      >
        <ENBLeaf size={80} />
      </motion.div>

      <h1 className={`text-4xl md:text-5xl font-bold text-enb-text-primary mb-4 tracking-tight ${isUrdu ? 'font-urdu leading-loose' : ''}`}>
        {l('welcome', 'headline')}
      </h1>
      <p className={`text-enb-text-secondary mb-10 max-w-md mx-auto text-lg leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
        {l('welcome', 'subtext')}
      </p>

      <div className="space-y-4 w-full max-w-sm relative z-10">
        <Link to="/signup/step1">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`w-full bg-enb-green text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-enb-green/90 transition-all flex items-center justify-center gap-2 group ${isUrdu ? 'font-urdu' : ''}`}
          >
            {l('common', 'signUp')}
            <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isUrdu ? 'rotate-180' : ''}`} />
          </motion.button>
        </Link>

        <Link to="/login">
          <button className={`w-full py-3 text-sm font-medium text-enb-text-secondary hover:text-enb-green hover:bg-enb-green/5 rounded-xl transition-colors ${isUrdu ? 'font-urdu' : ''}`}>
            {l('common', 'logIn')}
          </button>
        </Link>

        {/* What is ENB — prominent card */}
        <Link to="/about">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="w-full mt-2 flex items-center gap-3 bg-white border border-enb-green/20 rounded-xl px-4 py-3 hover:border-enb-green/50 hover:bg-enb-green/5 transition-all group shadow-sm"
          >
            <div className="w-9 h-9 bg-enb-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-enb-green" />
            </div>
            <div className={`text-left flex-1 ${isUrdu ? 'text-right' : ''}`}>
              <div className={`text-sm font-bold text-enb-green ${isUrdu ? 'font-urdu' : ''}`}>{l('welcome', 'whatIsEnb')}</div>
              <div className={`text-xs text-gray-500 ${isUrdu ? 'font-urdu' : ''}`}>{l('welcome', 'whatIsEnbSub')}</div>
            </div>
            <ArrowRight className={`w-4 h-4 text-enb-green/50 group-hover:text-enb-green transition-all flex-shrink-0 ${isUrdu ? 'rotate-180' : ''}`} />
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
