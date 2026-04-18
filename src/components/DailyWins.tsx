import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Trophy, Zap, Heart } from 'lucide-react';

interface DailyWinsProps {
  wins: number;
  sabrPoints: number;
  streak: number;
}

export const DailyWins: React.FC<DailyWinsProps> = ({ wins, sabrPoints, streak }) => {
  const stats = [
    { label: 'Daily Wins', value: wins, icon: <CheckCircle2 size={16} />, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'Sabr Points', value: sabrPoints, icon: <Heart size={16} />, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Streak', value: streak, icon: <Zap size={16} />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/50 backdrop-blur-md border border-white/20 p-4 rounded-[2rem] flex flex-col items-center text-center group"
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${stat.bg} ${stat.color}`}>
            {stat.icon}
          </div>
          <span className="text-lg font-black text-text tracking-tight">{stat.value}</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-text/40">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  );
};
