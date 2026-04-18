import { Flame, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface ProgressCardProps {
  completed: number;
  total: number;
  streak: number;
}

export const ProgressCard = ({ completed, total, streak }: ProgressCardProps) => {
  const percentage = Math.round((completed / total) * 100);
  const momentum = streak > 0 ? Math.min(100, (streak * 10) + (percentage / 2)) : 0;

  return (
    <section className="px-6 py-2">
      <div className="bg-card rounded-[2.5rem] p-8 shadow-sm border border-border relative overflow-hidden group">
        {/* Background Momentum Pulse */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1], 
            opacity: [0.03, 0.08, 0.03],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand rounded-full blur-[80px]"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shadow-inner">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text/40">Momentum</p>
                <p className="text-xs font-black text-text uppercase tracking-widest">Growth Phase</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-2xl border border-brand/20 shadow-sm">
              <Flame size={14} fill="currentColor" className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">{streak} Day Streak</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text/40">Daily Progress</p>
                  <p className="text-2xl font-black text-text tracking-tighter">{percentage}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text/40">Sabr Points</p>
                  <p className="text-lg font-black text-brand tracking-tight">+{percentage * 10}</p>
                </div>
              </div>
              <div className="h-3 bg-text/5 rounded-full overflow-hidden p-0.5 border border-border">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 2, ease: [0.34, 1.56, 0.64, 1] }}
                  className="h-full bg-brand rounded-full relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center text-text/40 border border-border">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text/40">Current State</p>
                  <p className="text-sm font-black text-text tracking-tight">
                    {momentum > 70 ? 'Flow State' : momentum > 30 ? 'Steady Progress' : 'Warming Up'}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-brand/20 animate-ping" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
