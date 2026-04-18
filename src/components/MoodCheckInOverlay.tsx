import React from 'react';
import { motion } from 'motion/react';
import { Mood } from '../types';

interface MoodCheckInOverlayProps {
  onSelectMood: (mood: Mood) => void;
}

export const MoodCheckInOverlay = ({ onSelectMood }: MoodCheckInOverlayProps) => {
  const moods: { type: Mood; label: string; color: string; icon: React.ReactNode }[] = [
    { 
      type: 'very-sad', 
      label: 'Struggling', 
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 15C8 15 9.5 13.5 12 13.5C14.5 13.5 16 15 16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
        </svg>
      )
    },
    { 
      type: 'sad', 
      label: 'Low', 
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.3)]',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 16C9 16 10.5 15 12 15C13.5 15 15 16 15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
        </svg>
      )
    },
    { 
      type: 'neutral', 
      label: 'Neutral', 
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 15H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
        </svg>
      )
    },
    { 
      type: 'happy', 
      label: 'Good', 
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
        </svg>
      )
    },
    { 
      type: 'very-happy', 
      label: 'Content', 
      color: 'text-brand bg-brand/10 border-brand/30 shadow-[0_0_20px_rgba(0,230,118,0.3)]',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 13C7 13 9 17 12 17C15 17 17 13 17 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <circle cx="15" cy="10" r="1.5" fill="currentColor" />
        </svg>
      )
    },
  ];

  const [selected, setSelected] = React.useState<Mood | null>(null);

  const handleSelect = (mood: Mood) => {
    setSelected(mood);
    // Use a small delay for feedback loop
    setTimeout(() => {
      onSelectMood(mood);
    }, 400);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-deep/80 backdrop-blur-[85px] p-6"
    >
      <div className="max-w-xs w-full text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-brand text-3xl font-black tracking-tight mb-2">Welcome back.</h2>
          <p className="text-slate-800 text-base font-bold mb-12 drop-shadow-sm opacity-90">Let's start with a check-in. How are you feeling, right now?</p>
        </motion.div>

        <div className="flex justify-between items-center gap-2">
          {moods.map((mood, index) => (
            <motion.button
              key={mood.type}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSelect(mood.type)}
              className="group flex flex-col items-center gap-3"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                selected === mood.type 
                  ? mood.color
                  : "bg-white/5 border-white/10 text-slate-500 group-hover:bg-white/10"
              } inner-glow`}>
                {mood.icon}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                selected === mood.type 
                  ? mood.color.split(' ')[0]
                  : "text-slate-500 group-hover:text-white"
              }`}>
                {mood.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
