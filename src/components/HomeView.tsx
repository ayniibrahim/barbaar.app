import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Clock, Zap,
  ChevronRight, Shield,
  Trophy, Flame,
  Headphones, Users, PenTool, X, ArrowRight,
  CheckCircle2, Target
} from 'lucide-react';
import { Task, Mood, Priority, UserChallenge, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { getAvatarUrl } from '../services/gamificationService';

interface HomeViewProps {
  userName: string;
  gender?: 'male' | 'female' | 'other';
  level: number;
  tasks: Task[];
  userChallenges: UserChallenge[];
  onToggleTask: (id: string) => void;
  onStartFocus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onReorderTasks: (activeId: string, overId: string) => void;
  onAddTask: () => void;
  totalPoints: number;
  totalWords: number;
  totalWins: number;
  onSelectMood: (mood: Mood) => void;
  onViewChange: (view: any, params?: any) => void;
  growthScore: number;
  streak: number;
}

export const HomeView = ({ 
  userName, 
  gender,
  level,
  tasks, 
  userChallenges,
  onToggleTask, 
  onStartFocus, 
  onDeleteTask,
  onReorderTasks,
  onAddTask, 
  totalPoints,
  totalWords,
  totalWins,
  onSelectMood,
  onViewChange,
  growthScore,
  streak,
}: HomeViewProps) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const featuredTools = [
    { id: 'challenges', label: 'Daily Path', icon: Trophy, color: 'text-brand', desc: 'Discipline', bg: 'bg-brand/5' },
    { id: 'therapy', label: 'Therapy', icon: Users, color: 'text-purple-500', desc: 'Guidance', bg: 'bg-purple-500/5' },
    { id: 'journal', label: 'Reflections', icon: PenTool, color: 'text-amber-500', desc: 'Journaling', bg: 'bg-amber-500/5' },
  ];

  const activeTasks = tasks.filter(t => !t.completed);
  const activeChallenge = userChallenges.find(uc => uc.status === 'active');
  const today = new Date().toLocaleDateString();
  const todayProgress = activeChallenge?.dailyProgress[today]?.percentage || 0;

  const formatFocusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  return (
    <div className="pb-32 max-w-md mx-auto px-6 pt-12 space-y-12">
      {/* Greeting Section - Airy & Responsive Header */}
      <section>
        <div className="flex items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-0.5"
          >
            <p className="text-[9px] font-black text-brand uppercase tracking-[0.4em] opacity-80">{greeting}</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-text leading-[1.1]">
              Marhabbah,<br />
              <span className="text-brand">{userName}</span>
            </h2>
            <p className="text-[9px] font-bold text-text/30 uppercase tracking-[0.2em] pt-1">{dateString}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onViewChange('profile')}
            className="shrink-0 cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-card border-4 border-bg shadow-2xl overflow-hidden group-hover:scale-105 transition-transform">
              <img 
                src={getAvatarUrl({ name: userName, gender, level })} 
                alt={userName} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-2 text-center">
              <span className="text-[8px] font-black text-brand uppercase tracking-widest px-2 py-0.5 bg-brand/10 rounded-full">Lvl {level}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modern Gamification Row - Consolidated All-Time Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Growth Sabr', value: totalPoints, icon: Zap, color: 'text-brand' },
          { label: 'Words Written', value: totalWords, icon: PenTool, color: 'text-purple-500' },
          { label: 'Total Wins', value: totalWins, icon: Trophy, color: 'text-amber-500' },
          { label: 'Active Streak', value: `${streak}d`, icon: Flame, color: 'text-orange-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border/40 p-3 sm:p-4 rounded-3xl flex flex-col items-center justify-center space-y-2 shadow-sm relative overflow-hidden group"
          >
            <div className={cn("transition-transform group-hover:scale-110 duration-500", stat.color)}>
              <stat.icon size={12} fill="currentColor" className="opacity-10" />
            </div>
            <p className="text-base sm:text-lg font-black text-text tracking-tighter tabular-nums leading-none">{stat.value}</p>
            <p className="text-[7px] font-black text-text/30 uppercase tracking-[0.2em] leading-none text-center">{stat.label}</p>
          </motion.div>
        ))}
      </section>

      {/* Featured Rituals Well - The Core Logic grouped */}
      <section>
        <div className="bg-card/20 border border-border/40 rounded-[3rem] p-3 shadow-inner space-y-3">
          <div className="px-6 py-4">
            <h3 className="text-[10px] font-black text-text/20 uppercase tracking-[0.3em]">Core Rituals</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {featuredTools.map((tool, index) => (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onViewChange(tool.id)}
                className="w-full bg-card border border-border/50 p-5 rounded-[2.2rem] flex items-center justify-between group hover:border-brand/30 transition-all shadow-sm"
              >
                <div className="flex items-center gap-5">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", tool.bg, tool.color)}>
                    <tool.icon size={26} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-black text-text tracking-tight group-hover:text-brand transition-colors">{tool.label}</h4>
                    <p className="text-[9px] font-black text-text/30 uppercase tracking-widest">{tool.desc}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-text/10 group-hover:text-brand transition-colors group-hover:bg-brand/5">
                  <ChevronRight size={18} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Focus Today - Hooked & Attractive redesign */}
      <section>
        <div className="flex items-center justify-between pl-2 mb-6">
          <div>
            <h3 className="text-[10px] font-black text-text/20 uppercase tracking-[0.4em] mb-1">Today's Focus</h3>
            <p className="text-[8px] font-bold text-brand uppercase tracking-widest">{activeTasks.length} Active Challenges</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddTask}
            className="w-10 h-10 bg-brand text-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand/20"
          >
            <Plus size={20} />
          </motion.button>
        </div>
        
        <div className="space-y-4">
          {activeTasks.map((task, index) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div 
                onClick={() => onStartFocus(task.id)}
                className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden cursor-pointer hover:border-brand/30 transition-all z-10"
              >
                {/* Visual side glow based on priority */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1",
                  task.priority === 'high' ? "bg-rose-500" : 
                  task.priority === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                )} />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-black text-text/20 uppercase tracking-widest">{task.priority} INTENT</span>
                      <div className="h-px w-8 bg-border/20" />
                    </div>
                    <h4 className="text-xl font-black text-text tracking-tight group-hover:text-brand transition-colors">{task.title}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-text/[0.03] rounded-lg">
                        <Clock size={10} className="text-brand" />
                        <span className="text-[9px] font-bold text-text/40">{task.time}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id);
                    }}
                    className="w-16 h-16 bg-emerald-500/[0.03] text-emerald-500/30 rounded-3xl flex items-center justify-center border border-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all shadow-sm group/btn"
                  >
                    <CheckCircle2 size={28} className="transition-transform group-hover/btn:scale-110" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {activeTasks.length === 0 && (
            <div className="py-12 border-2 border-dashed border-border rounded-[3rem] text-center space-y-4">
              <div className="w-16 h-16 bg-bg rounded-3xl flex items-center justify-center text-text/10 mx-auto">
                <Target size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-text/20 uppercase tracking-widest">A Clear Mind</p>
                <p className="text-[8px] font-bold text-brand uppercase tracking-widest">Ready for the next mission?</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Emergency & Support - Kept as requested but refined */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-px flex-1 bg-border/10" />
          <h3 className="text-[9px] font-black text-text/10 uppercase tracking-[0.5em]">Safety</h3>
          <div className="h-px flex-1 bg-border/10" />
        </div>
        
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => onViewChange('emergency')}
          className="w-full bg-rose-500/[0.02] border border-rose-500/10 p-5 rounded-[2.5rem] flex items-center justify-between group hover:bg-rose-500/[0.04] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500/5 text-rose-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield size={22} />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black text-rose-600/60 uppercase tracking-tight">Emergency Mode</h4>
              <p className="text-[8px] font-black text-rose-500/40 uppercase tracking-widest mt-0.5">Instant Support Network</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-rose-500/20 group-hover:text-rose-500 transition-all group-hover:translate-x-1" />
        </motion.button>
      </section>
    </div>
  );
};
