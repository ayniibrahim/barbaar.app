import React from 'react';
import { Brain, PenTool, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickActionsProps {
  onStartTherapy: () => void;
  onNewJournal: () => void;
  onAddTask: () => void;
}

export const QuickActions = ({ onStartTherapy, onNewJournal, onAddTask }: QuickActionsProps) => {
  return (
    <section className="px-6 py-4">
      <div className="flex gap-4">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={onStartTherapy}
          className="flex-1 flex items-center gap-3 p-4 bg-card rounded-3xl border border-border shadow-sm"
        >
          <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
            <Brain size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight text-text">Therapy</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={onNewJournal}
          className="flex-1 flex items-center gap-3 p-4 bg-card rounded-3xl border border-border shadow-sm"
        >
          <div className="w-10 h-10 rounded-2xl bg-text/5 flex items-center justify-center text-text/60">
            <PenTool size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight text-text">Journal</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={onAddTask}
          className="w-14 h-14 rounded-3xl bg-brand text-brand-dark shadow-lg shadow-brand/20 flex items-center justify-center"
        >
          <Plus size={24} />
        </motion.button>
      </div>
    </section>
  );
};
