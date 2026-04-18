import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, X, SkipForward, CheckCircle2, Zap, Target } from 'lucide-react';
import { cn } from '../lib/utils';

interface FocusTimerProps {
  taskTitle: string;
  onComplete: (timeSpent: number) => void;
  onCancel: () => void;
}

export const FocusTimer = ({ taskTitle, onComplete, onCancel }: FocusTimerProps) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    setIsActive(false);
    onComplete(seconds);
  };

  if (isFinishing) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/60 backdrop-blur-3xl p-6"
    >
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.9 }}
        className="max-w-sm w-full bg-card border border-border rounded-[4rem] p-10 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-brand" />
        
        <button 
          onClick={onCancel}
          className="absolute top-8 right-8 w-10 h-10 rounded-2xl bg-text/5 flex items-center justify-center text-text/40 hover:text-rose-500 transition-all z-10"
        >
          <X size={20} />
        </button>

        <div className="mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-brand" 
            />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand">Deep Focus Mode</p>
          </div>
          <h2 className="text-2xl font-black text-text tracking-tight line-clamp-2 leading-tight px-4">{taskTitle}</h2>
        </div>

        <div className="relative w-64 h-64 mx-auto mb-12 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="116"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-text/5"
            />
            <motion.circle
              cx="128"
              cy="128"
              r="116"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 116}
              initial={{ strokeDashoffset: 2 * Math.PI * 116 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              strokeLinecap="round"
              fill="transparent"
              className="text-brand"
            />
          </svg>
          <div className="flex flex-col items-center">
            <div className="text-7xl font-black text-text tracking-tighter tabular-nums drop-shadow-sm">
              {formatTime(seconds)}
            </div>
            <p className="text-[10px] font-black text-text/20 uppercase tracking-[0.3em] mt-2">Elapsed Time</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mb-12">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
            className="w-16 h-16 rounded-[2rem] bg-text/5 border border-border flex items-center justify-center text-text/40 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
            title="Cancel Session"
          >
            <X size={28} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsActive(!isActive)}
            className="w-28 h-28 rounded-[3rem] bg-brand text-brand-dark flex items-center justify-center shadow-2xl shadow-brand/30 ring-[12px] ring-brand/10"
          >
            {isActive ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-1" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleComplete}
            className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
            title="Quick Complete"
          >
            <CheckCircle2 size={28} />
          </motion.button>
        </div>

        <div className="space-y-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleComplete}
            className="w-full py-6 bg-brand text-brand-dark rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-brand/20 flex items-center justify-center gap-3"
          >
            <Zap size={18} fill="currentColor" />
            Finish Session
          </motion.button>
          
          <button 
            onClick={onCancel}
            className="w-full py-4 bg-text/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text/40 hover:text-brand hover:bg-brand/5 transition-all flex items-center justify-center gap-2"
          >
            <SkipForward size={14} />
            Skip Timer & Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
