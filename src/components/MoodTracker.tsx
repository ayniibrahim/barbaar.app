import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Mood } from '../types';

const moods: { type: Mood; emoji: string; color: string }[] = [
  { type: 'very-sad', emoji: '😞', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  { type: 'sad', emoji: '😕', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { type: 'neutral', emoji: '😐', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { type: 'happy', emoji: '🙂', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { type: 'very-happy', emoji: '✨', color: 'bg-brand/10 text-brand border-brand/20' },
];

interface MoodTrackerProps {
  selectedMood?: Mood;
  onSelectMood: (mood: Mood) => void;
}

export const MoodTracker = ({ selectedMood, onSelectMood }: MoodTrackerProps) => {
  return (
    <div className="flex justify-between items-center bg-bg/50 rounded-2xl p-1.5 border border-border/50">
      {moods.map((mood) => (
        <motion.button
          key={mood.type}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelectMood(mood.type)}
          className={cn(
            "flex-1 py-3 flex items-center justify-center rounded-xl transition-all duration-300 border",
            selectedMood === mood.type 
              ? cn("shadow-sm scale-110 rotate-2", mood.color) 
              : "border-transparent hover:bg-card/40"
          )}
        >
          <span className={cn(
            "text-2xl transition-all",
            selectedMood !== mood.type && "grayscale opacity-30 scale-90"
          )}>
            {mood.emoji}
          </span>
        </motion.button>
      ))}
    </div>
  );
};
