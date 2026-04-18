import React from 'react';
import { motion } from 'motion/react';
import { LEVELS } from '../services/gamificationService';

interface LevelProgressProps {
  level: number;
  experience: number;
  nextLevelExp: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ level, experience, nextLevelExp }) => {
  const currentLevelInfo = LEVELS.find(l => l.level === level) || LEVELS[0];
  const prevLevelExp = LEVELS.find(l => l.level === level - 1)?.minExp || 0;
  
  const progress = ((experience - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100;

  return (
    <div className="bg-white/50 backdrop-blur-md border border-white/20 p-6 rounded-[2.5rem] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text/40 mb-1">Level {level}</p>
          <h3 className="text-xl font-black text-text tracking-tight">{currentLevelInfo.title}</h3>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-lg">
          {level}
        </div>
      </div>
      
      <div className="relative h-3 bg-bg rounded-full overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-brand"
        />
      </div>
      
      <div className="flex justify-between mt-2">
        <span className="text-[10px] font-bold text-text/40 uppercase tracking-widest">{experience} XP</span>
        <span className="text-[10px] font-bold text-text/40 uppercase tracking-widest">{nextLevelExp} XP to Level {level + 1}</span>
      </div>
    </div>
  );
};
