import React from 'react';
import { motion } from 'motion/react';

interface FocusRingProps {
  completed: number;
  total: number;
}

export const FocusRing = ({ completed, total }: FocusRingProps) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = (completed / total) * 100;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-[240px] h-[240px] mx-auto">
      {/* Background Ring */}
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="120"
          cy="120"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-text/5"
        />
        {/* Progress Ring */}
        <motion.circle
          cx="120"
          cy="120"
          r={radius}
          stroke="url(#ring-gradient)"
          strokeWidth="12"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "circOut" }}
          strokeLinecap="round"
          fill="transparent"
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand)" />
            <stop offset="100%" stopColor="var(--color-brand-dark)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span 
          key={completed}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black text-text tracking-tighter"
        >
          {completed} / {total}
        </motion.span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text/40 mt-1">Focus Completed</span>
      </div>
    </div>
  );
};
