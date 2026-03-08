import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Store, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    icon: Leaf,
    title: "Do Good, Get Verified, Earn ENB",
    description: "Participate in community actions like cleanups and recycling. Once verified, you'll earn ENB tokens.",
    color: "text-enb-green",
    bg: "bg-enb-green/10",
  },
  {
    icon: Store,
    title: "Spend at Partner Businesses",
    description: "Use your ENB tokens at local businesses for discounts and special offers.",
    color: "text-enb-teal",
    bg: "bg-enb-teal/10",
  },
  {
    icon: ShieldCheck,
    title: "Build Reputation, Unlock Bridge",
    description: "Earn reputation points to unlock advanced features like bridging ENB to Solana.",
    color: "text-enb-gold",
    bg: "bg-enb-gold/10",
  },
];

export default function Tutorial() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/login'); // Or directly to dashboard if already authenticated
    }
  };

  const handleSkip = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-enb-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-enb-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-enb-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg relative z-10 flex flex-col items-center text-center h-[500px]">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${slides[currentSlide].bg}`}>
                {(() => {
                  const Icon = slides[currentSlide].icon;
                  return <Icon className={`w-12 h-12 ${slides[currentSlide].color}`} />;
                })()}
              </div>
              <h2 className="text-2xl font-bold text-enb-text-primary mb-4">{slides[currentSlide].title}</h2>
              <p className="text-enb-text-secondary text-lg leading-relaxed max-w-xs mx-auto">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-full mt-8 space-y-4">
          <div className="flex justify-center gap-2 mb-4">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-enb-green w-4' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button onClick={handleNext} className="w-full text-lg h-12">
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-enb-text-secondary transition-colors">
            Skip Tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
