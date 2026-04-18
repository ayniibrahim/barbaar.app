import { Settings, Shield, Award, Zap, ChevronRight, LogOut, Flame, Star, Target, Trophy, TrendingUp, Video, ArrowLeft, Lock, Unlock, HandMetal, User, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge, Task, Milestone, Booking, Achievement, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { History, CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENTS, LEVELS, getAvatarUrl } from '../services/gamificationService';

interface ProfileViewProps {
  name: string;
  level: number;
  experience: number;
  nextLevelExp: number;
  streak: number;
  points: number;
  badges: Badge[];
  milestones: Milestone[];
  tasks: Task[];
  bookings: Booking[];
  unlockedFeatures?: string[];
  userAchievements?: string[];
  encouragementsReceived?: number;
  totalWordCount?: number;
  totalWins?: number;
  gender?: 'male' | 'female' | 'other';
  isAdmin?: boolean;
  onAdminClick?: () => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
  onBack?: () => void;
  onLogout?: () => void;
}

export const ProfileView = ({ 
  name, 
  level, 
  experience, 
  nextLevelExp, 
  streak, 
  points, 
  badges, 
  milestones, 
  tasks, 
  bookings, 
  unlockedFeatures = [],
  userAchievements = [],
  encouragementsReceived = 0,
  totalWordCount = 0,
  totalWins = 0,
  gender,
  isAdmin = false,
  onAdminClick,
  onUpdateProfile,
  onBack, 
  onLogout 
}: ProfileViewProps) => {
  const completedTasks = tasks.filter(t => t.completed);
  const totalFocusTime = tasks.reduce((acc, t) => acc + (t.focusTimeSpent || 0), 0);
  const progressToNextLevel = nextLevelExp > 0 ? (experience / nextLevelExp) * 100 : 0;
  const currentLevelInfo = LEVELS.find(l => l.level === level) || LEVELS[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const categories = [
    { id: 'consistency', label: 'Consistency', icon: <Flame size={14} /> },
    { id: 'mindset', label: 'Mindset', icon: <Star size={14} /> },
    { id: 'community', label: 'Community', icon: <Award size={14} /> },
    { id: 'growth', label: 'Growth', icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-bg p-6 pb-32 text-text">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-text/40 hover:text-brand transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h2 className="text-3xl font-black tracking-tight text-text">Identity</h2>
        </div>
        <button 
          onClick={onLogout}
          className="p-3 bg-card rounded-2xl border border-border shadow-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Profile Card */}
      <section className="bg-card p-8 mb-8 rounded-[3rem] relative overflow-hidden border border-border shadow-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-bg shadow-2xl">
              <img 
                src={getAvatarUrl({ name, gender, level })} 
                alt={name} 
                className="w-full h-full object-cover bg-brand/5"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-brand text-brand-dark rounded-2xl flex items-center justify-center border-4 border-bg shadow-xl">
              <Trophy size={20} fill="currentColor" />
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-black text-text tracking-tight">{name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-black text-brand uppercase tracking-widest">Level {level}</span>
              <span className="w-1 h-1 bg-text/10 rounded-full"></span>
              <span className="text-xs font-bold text-text/40 uppercase tracking-widest">{currentLevelInfo.title}</span>
            </div>
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand/10 border border-brand/20 p-6 rounded-[2.5rem] mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                  <Shield size={24} className="text-brand-dark" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text tracking-tight">Admin Console</h3>
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest">Management & Insights</p>
                </div>
              </div>
              <button 
                onClick={onAdminClick}
                className="bg-brand text-brand-dark px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 transition-transform"
              >
                Open Dashboard
              </button>
            </div>
          </motion.div>
        )}

        {/* Level Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-text/40">
            <span>Progress to Level {level + 1}</span>
            <span className="text-brand">{Math.round(progressToNextLevel)}%</span>
          </div>
          <div className="h-4 bg-bg rounded-full overflow-hidden p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextLevel}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="h-full bg-brand rounded-full shadow-[0_0_15px_rgba(0,230,118,0.4)] relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
            </motion.div>
          </div>
          <p className="text-[10px] text-center text-text/40 font-black uppercase tracking-widest">
            {nextLevelExp - experience} EXP until your next evolution
          </p>
        </div>
      </section>

      {/* Unlocked Features */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-text tracking-tight flex items-center gap-2">
            <Trophy size={24} className="text-brand" /> Roadmap & Features
          </h3>
        </div>
        <div className="space-y-4">
          <div className="p-1.5 bg-bg rounded-[2rem] border border-border">
            <div className="grid grid-cols-1 gap-2">
              {currentLevelInfo.unlocks.map((unlock, idx) => (
                <div key={idx} className="bg-card p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm border border-brand/10 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                      <Unlock size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest">Unlocked</span>
                      <p className="text-sm font-black text-text tracking-tight">{unlock}</p>
                    </div>
                  </div>
                  <CheckCircle2 size={20} className="text-brand" />
                </div>
              ))}
              
              {LEVELS.filter(l => l.level > level).map(nextLevel => (
                nextLevel.unlocks.map((unlock, idx) => (
                  <div key={`locked-${nextLevel.level}-${idx}`} className="p-5 rounded-[1.5rem] flex items-center justify-between opacity-40 border border-border border-dashed">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-text/5 flex items-center justify-center text-text/20">
                        <Lock size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-text/40 uppercase tracking-widest">Locked</span>
                        <p className="text-sm font-black text-text/40 tracking-tight">{unlock}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-brand uppercase tracking-widest px-3 py-1 bg-brand/5 rounded-full border border-brand/10 whitespace-nowrap">
                      Lvl {nextLevel.level}
                    </span>
                  </div>
                ))
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-text tracking-tight flex items-center gap-2">
            <Award size={24} className="text-brand" /> Achievements
          </h3>
          <span className="text-[10px] font-black text-text/40 uppercase tracking-widest">
            {userAchievements.length}/{ACHIEVEMENTS.length} Unlocked
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = userAchievements.includes(achievement.id);
            return (
              <div 
                key={achievement.id}
                className={cn(
                  "bg-card border p-5 rounded-[2rem] flex flex-col items-center text-center transition-all duration-500 shadow-sm",
                  isUnlocked 
                    ? "bg-gradient-to-br from-white to-brand/5 border-brand/30 ring-1 ring-brand/10 shadow-lg shadow-brand/5" 
                    : "border-border opacity-50 grayscale"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl mb-4 shadow-inner transition-all duration-700",
                  isUnlocked 
                    ? "bg-gradient-to-br from-brand to-emerald-400 text-brand-dark shadow-lg shadow-brand/20 scale-110 rotate-3" 
                    : "bg-bg text-text/20"
                )}>
                  {achievement.icon}
                </div>
                <h4 className="text-xs font-black text-text tracking-tight mb-1">{achievement.name}</h4>
                <p className="text-[9px] font-bold text-text/40 uppercase tracking-widest leading-tight">
                  {achievement.description}
                </p>
                {isUnlocked && (
                  <div className="mt-3 px-2 py-1 bg-brand/10 text-brand rounded-lg text-[8px] font-black uppercase tracking-widest">
                    Unlocked
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Grid */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-text tracking-tight flex items-center gap-2">
            <TrendingUp size={24} className="text-brand" /> Progress Stats
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
            <p className="text-[10px] font-black text-text/40 uppercase tracking-widest mb-1">Total Focus</p>
            <p className="text-xl font-black text-text">{formatTime(totalFocusTime)}</p>
          </div>
          <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
            <p className="text-[10px] font-black text-text/40 uppercase tracking-widest mb-1">Total Wins</p>
            <p className="text-xl font-black text-text">{totalWins}</p>
          </div>
          <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
            <p className="text-[10px] font-black text-text/40 uppercase tracking-widest mb-1">Current Streak</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-black text-text">{streak}</p>
              <Flame size={18} className="text-orange-500" fill="currentColor" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
            <p className="text-[10px] font-black text-text/40 uppercase tracking-widest mb-1">Sabr Points</p>
            <p className="text-xl font-black text-brand">{points}</p>
          </div>
          <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
            <p className="text-[10px] font-black text-text/40 uppercase tracking-widest mb-1">Words Written</p>
            <p className="text-xl font-black text-text">{totalWordCount.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Valuable Prizes / Encouragements */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-text tracking-tight flex items-center gap-2">
            <HandMetal size={24} className="text-brand" /> Encouragement Claps
          </h3>
        </div>
        <div className="bg-brand-dark rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl shadow-brand-dark/20">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2">Community Support</p>
              <h4 className="text-3xl font-black text-white tracking-tighter">{encouragementsReceived}</h4>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Claps Received</p>
            </div>
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand border border-white/10">
              <HandMetal size={32} fill="currentColor" />
            </div>
          </div>
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-6 leading-relaxed">
            These claps are sent by your accountability partners to acknowledge your discipline and hard work.
          </p>
        </div>
      </section>

      {/* Logout Button */}
      <button 
        onClick={onLogout}
        className="w-full bg-red-500 text-white p-5 rounded-[2rem] shadow-lg shadow-red-500/20 flex items-center justify-center gap-3 group transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <LogOut size={24} />
        <span className="font-black uppercase tracking-widest text-sm">Sign Out</span>
      </button>
    </div>
  );
};
