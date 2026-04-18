import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, Star } from 'lucide-react';
import { Badge } from '../types';
import confetti from 'canvas-confetti';

interface AchievementUnlockOverlayProps {
  achievement: Badge | null;
  onClose: () => void;
}

export const AchievementUnlockOverlay = ({ achievement, onClose }: AchievementUnlockOverlayProps) => {
  useEffect(() => {
    if (achievement) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      const timer = setTimeout(onClose, 5000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-brand-dark/90 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.1, y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-card w-full max-w-sm rounded-[3rem] p-10 text-center relative overflow-hidden border border-white/20 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand/20 rounded-full blur-[80px] -mt-32" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand/10 rounded-full blur-[80px] -mb-32" />

            <div className="relative z-10">
              <motion.div
                initial={{ rotate: -10, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-24 h-24 bg-gradient-to-br from-brand to-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand/40 relative"
              >
                <div className="absolute inset-0 bg-white/20 rounded-[2rem] animate-pulse" />
                <Trophy size={48} className="text-brand-dark relative z-10" fill="currentColor" />
                
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-4 border-2 border-dashed border-brand/30 rounded-[2.5rem]"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-3xl font-black text-text tracking-tighter mb-2">Achievement Unlocked!</h2>
                <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-6">You've reached a new milestone</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-bg/50 border border-border p-6 rounded-[2rem] mb-8"
              >
                <div className="text-4xl mb-3">{achievement.icon}</div>
                <h3 className="text-xl font-black text-text mb-1">{achievement.name}</h3>
                <p className="text-xs font-bold text-text/40 uppercase tracking-widest leading-tight">
                  {achievement.description}
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onClose}
                className="w-full py-5 bg-brand text-brand-dark rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-brand/20 active:scale-95 transition-all"
              >
                Continue Your Journey
              </motion.button>
            </div>

            {/* Floating Sparkles */}
            <motion.div
              animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-10 right-10 text-brand/40"
            >
              <Sparkles size={24} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute bottom-20 left-10 text-brand/30"
            >
              <Star size={20} fill="currentColor" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
