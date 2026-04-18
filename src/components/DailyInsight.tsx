import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Lightbulb, Target } from 'lucide-react';

const INSIGHTS = [
  { 
    type: 'wisdom', 
    icon: <Lightbulb size={16} />, 
    text: "Small steps don't just lead to big goals—they ARE the big goals.",
    somali: "Tallaabooyinka yaryar maahan kaliya wadada guusha—waa guusha lafteeda."
  },
  { 
    type: 'challenge', 
    icon: <Target size={16} />, 
    text: "Can you drink one glass of water right now? Just one.",
    somali: "Ma cabbi kartaa hal koob oo biyo ah hadda? Hal kaliya."
  },
  { 
    type: 'insight', 
    icon: <Sparkles size={16} />, 
    text: "Your brain loves completion. Finish one tiny thing to feel better.",
    somali: "Maskaxdaadu waxay jeceshahay dhammaystirka. Hal shay oo yar samee."
  }
];

export const DailyInsight = () => {
  const [insight] = React.useState(() => INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)]);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-2"
    >
      <div className="bg-brand-dark rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl shadow-brand-dark/20">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand/20 rounded-full blur-3xl group-hover:bg-brand/30 transition-all duration-700" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-brand/10 rounded-full blur-3xl group-hover:bg-brand/20 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-brand border border-white/10">
              {insight.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Daily Seed</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">{insight.type}</p>
            </div>
          </div>

          <p className="text-white font-black text-lg leading-tight mb-4 tracking-tight">
            {insight.text}
          </p>
          
          <div className="flex items-start gap-3 pt-4 border-t border-white/5">
            <Sparkles size={14} className="text-white/20 mt-1 shrink-0" />
            <p className="text-white/40 text-xs font-medium italic leading-relaxed">
              "{insight.somali}"
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
