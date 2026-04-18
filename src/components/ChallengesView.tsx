import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Plus, 
  ChevronLeft, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Users, 
  ArrowRight,
  Shield,
  Target,
  Flame,
  X,
  PlusCircle,
  Trash2,
  Activity,
  Share2,
  Lock,
  HandMetal,
  AlertCircle
} from 'lucide-react';
import { Challenge, UserChallenge, ChallengeTask } from '../types';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { getAvatarUrl, LEVELS } from '../services/gamificationService';

interface ChallengesViewProps {
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  userAchievements: string[];
  sabrPoints?: number;
  points?: number;
  isAdmin?: boolean;
  onJoinChallenge: (challengeId: string) => void;
  onLeaveChallenge: (userChallengeId: string) => void;
  onCheckIn: (userChallengeId: string, taskId: string) => void;
  onCreateChallenge: (challenge: Partial<Challenge>) => void;
  onDeleteChallenge: (challengeId: string) => void;
  onSendEncouragement: (targetUserId: string, challengeTitle: string) => void;
  onBack: () => void;
  initialChallengeId?: string;
}

const handleShare = async (challenge: Challenge) => {
  const shareData = {
    title: `Join my ${challenge.title} challenge!`,
    text: `I'm taking on the ${challenge.title} in Barbaar App. Join me as an accountability partner!`,
    url: `${window.location.origin}?challengeId=${challenge.id}`
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      alert('Challenge link copied to clipboard!');
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Error sharing:', err);
    }
  }
};

export const ChallengesView = ({ 
  challenges, 
  userChallenges, 
  userAchievements = [],
  sabrPoints = 0,
  points = 0,
  isAdmin = false,
  onJoinChallenge, 
  onLeaveChallenge,
  onCheckIn, 
  onCreateChallenge,
  onDeleteChallenge,
  onSendEncouragement,
  onBack,
  initialChallengeId
}: ChallengesViewProps) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-challenges'>('my-challenges');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedUserChallengeId, setSelectedUserChallengeId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (initialChallengeId) {
      const challenge = challenges.find(c => c.id === initialChallengeId);
      if (challenge) {
        setSelectedChallenge(challenge);
        setActiveTab('browse');
      }
    }
  }, [initialChallengeId, challenges]);

  const selectedUserChallenge = selectedUserChallengeId 
    ? (() => {
        const uc = userChallenges.find(u => u.id === selectedUserChallengeId);
        if (!uc) return null;
        const c = challenges.find(ch => ch.id === uc.challengeId);
        if (!c) return null;
        return { uc, c };
      })()
    : null;

  const myActiveChallenges = userChallenges.filter(uc => uc.status === 'active');
  
  const joinedChallengesWithData = myActiveChallenges.map(uc => {
    const challengeData = challenges.find(c => c.id === uc.challengeId);
    return { ...uc, challengeData };
  }).filter(item => item.challengeData);

  const isSabarMaster = isAdmin || userAchievements.includes('5') || sabrPoints >= 1000 || points >= 1000;

  return (
    <div className="min-h-screen bg-bg pb-32">
      <div className="max-w-md mx-auto px-6">
        <header className="pt-12 pb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 text-text/20 hover:text-text transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black tracking-tight text-text">Challenges</h2>
              <p className="text-[8px] font-black text-text/10 uppercase tracking-[0.2em]">Discipline & Growth</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (isSabarMaster) {
                setIsCreating(true);
              } else {
                alert('Unlock "Sabar Master" achievement to create custom challenges!');
              }
            }}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all",
              isSabarMaster ? "bg-brand/10 text-brand" : "bg-text/5 text-text/20"
            )}
          >
            {isSabarMaster ? <Plus size={20} /> : <Lock size={18} />}
          </button>
        </header>

        <div className="flex gap-2 mb-8 bg-card/50 p-1 rounded-2xl border border-border/50">
          <button
            onClick={() => setActiveTab('my-challenges')}
            className={cn(
              "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
              activeTab === 'my-challenges' ? "bg-card text-text shadow-sm" : "text-text/30"
            )}
          >
            My Path
            {myActiveChallenges.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-brand text-brand-dark rounded-full text-[8px]">
                {myActiveChallenges.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={cn(
              "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
              activeTab === 'browse' ? "bg-card text-text shadow-sm" : "text-text/30"
            )}
          >
            Browse
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'browse' ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {challenges.filter(c => c.published || c.isCustom).map((challenge) => {
                const userChallenge = userChallenges.find(uc => uc.challengeId === challenge.id && uc.status === 'active');
                return (
                  <ChallengeCard 
                    key={challenge.id} 
                    challenge={challenge} 
                    onJoin={() => setSelectedChallenge(challenge)}
                    onOpenActive={() => userChallenge && setSelectedUserChallengeId(userChallenge.id)}
                    onDelete={challenge.isCustom ? () => onDeleteChallenge(challenge.id) : undefined}
                    isJoined={!!userChallenge}
                  />
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="my-challenges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {joinedChallengesWithData.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-text/[0.02] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="text-text/10" size={24} />
                  </div>
                  <p className="text-sm font-black text-text/40 mb-1">No active challenges</p>
                  <p className="text-[10px] font-bold text-text/20 uppercase tracking-widest">Join one from the browse tab</p>
                </div>
              ) : (
                joinedChallengesWithData.map((item) => (
                  <ActiveChallengeCard 
                    key={item.id} 
                    userChallenge={item} 
                    challenge={item.challengeData!}
                    onOpen={() => setSelectedUserChallengeId(item.id)}
                    onCheckIn={(taskId) => onCheckIn(item.id, taskId)}
                    onLeave={() => onLeaveChallenge(item.id)}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedChallenge && (
          <ChallengeDetailModal 
            challenge={selectedChallenge} 
            onClose={() => setSelectedChallenge(null)}
            onJoin={() => {
              onJoinChallenge(selectedChallenge.id);
              setSelectedChallenge(null);
              setActiveTab('my-challenges');
            }}
            onOpenActive={() => {
              const uc = userChallenges.find(uc => uc.challengeId === selectedChallenge.id);
              if (uc) {
                setSelectedUserChallengeId(uc.id);
                setSelectedChallenge(null);
              }
            }}
            isJoined={userChallenges.some(uc => uc.challengeId === selectedChallenge.id)}
          />
        )}
        {isCreating && (
          <CreateChallengeModal 
            onClose={() => setIsCreating(false)}
            onCreate={(data) => {
              onCreateChallenge(data);
              setIsCreating(false);
            }}
          />
        )}
        {selectedUserChallenge && (
          <ActiveChallengeDetailModal
            userChallenge={selectedUserChallenge.uc}
            challenge={selectedUserChallenge.c}
            onClose={() => setSelectedUserChallengeId(null)}
            onCheckIn={(taskId) => onCheckIn(selectedUserChallenge.uc.id, taskId)}
            onSendEncouragement={onSendEncouragement}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ChallengeCard = ({ 
  challenge, 
  onJoin, 
  onOpenActive,
  onDelete, 
  isJoined 
}: { 
  challenge: Challenge, 
  onJoin: () => void, 
  onOpenActive: () => void,
  onDelete?: () => void, 
  isJoined: boolean 
}) => {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={isJoined ? onOpenActive : onJoin}
      className="bg-card rounded-[2.5rem] p-6 border border-border shadow-sm overflow-hidden relative group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
          challenge.category === 'discipline' ? "bg-brand/10 text-brand" :
          challenge.category === 'productivity' ? "bg-blue-500/10 text-blue-500" :
          challenge.category === 'health' ? "bg-emerald-500/10 text-emerald-500" :
          "bg-purple-500/10 text-purple-500"
        )}>
          {challenge.category}
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-rose-500/30 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
          <div className="flex items-center gap-1 text-[8px] font-black text-text/20 uppercase tracking-widest">
            <Users size={10} />
            {challenge.participantsCount} Joined
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-black text-text mb-2">{challenge.title}</h3>
        <p className="text-xs text-text/40 leading-relaxed mb-6 line-clamp-2">{challenge.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] font-black text-text/60">
              <Clock size={12} className="text-brand" />
              {challenge.durationDays} Days
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-text/60">
              <Target size={12} className="text-brand" />
              {challenge.tasks.length} Tasks
            </div>
          </div>
          
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
            isJoined ? "bg-emerald-500 text-white" : "bg-brand text-brand-dark group-hover:translate-x-1"
          )}>
            {isJoined ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ActiveChallengeCard = ({ 
  userChallenge, 
  challenge, 
  onOpen,
  onLeave
}: { 
  userChallenge: UserChallenge, 
  challenge: Challenge,
  onOpen: () => void,
  onCheckIn: (taskId: string) => void,
  onLeave: () => void
}) => {
  const today = new Date().toLocaleDateString();
  const todayProgress = userChallenge.dailyProgress[today] || { completedTasks: [], percentage: 0 };
  const isDayComplete = todayProgress.percentage >= 100;
  
  return (
    <div 
      onClick={onOpen}
      className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm cursor-pointer hover:border-brand/30 transition-all group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-black text-text group-hover:text-brand transition-colors">{challenge.title}</h3>
            {isDayComplete && (
              <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                Daily Goal Met
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black text-text/20 uppercase tracking-widest">Day {userChallenge.currentDay} of {challenge.durationDays}</span>
            <div className="w-1 h-1 bg-text/10 rounded-full" />
            <div className="flex items-center gap-1 text-[9px] font-black text-brand uppercase tracking-widest">
              <Flame size={10} />
              {userChallenge.streak} Day Streak
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="w-12 h-12 rounded-2xl bg-brand/5 flex items-center justify-center text-brand font-black text-sm">
            {Math.round(todayProgress.percentage)}%
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onLeave(); }}
            className="text-[8px] font-black text-rose-500/40 hover:text-rose-500 uppercase tracking-widest transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="w-full h-2 bg-bg rounded-full mb-4 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${todayProgress.percentage}%` }}
          className="h-full bg-brand rounded-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[8px] font-black text-text/20 uppercase tracking-widest">Tap to view roadmap & partners</p>
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-6 h-6 rounded-full bg-bg border-2 border-white flex items-center justify-center overflow-hidden">
              <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ))}
          <div className="w-6 h-6 rounded-full bg-brand text-brand-dark border-2 border-white flex items-center justify-center text-[8px] font-black">
            +
          </div>
        </div>
      </div>
    </div>
  );
};

const ChallengeDetailModal = ({ challenge, onClose, onJoin, onOpenActive, isJoined }: { challenge: Challenge, onClose: () => void, onJoin: () => void, onOpenActive?: () => void, isJoined: boolean }) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [step, setStep] = useState<'details' | 'terms'>('details');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-bg w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-40 bg-brand/10 shrink-0">
          {challenge.image ? (
            <img src={challenge.image} alt={challenge.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy size={48} className="text-brand/20" />
            </div>
          )}
          <button 
            onClick={() => handleShare(challenge)}
            className="absolute top-6 left-6 w-10 h-10 bg-card/80 backdrop-blur-md rounded-full flex items-center justify-center text-text shadow-lg"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-card/80 backdrop-blur-md rounded-full flex items-center justify-center text-text shadow-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 'details' ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-black text-text">{challenge.title}</h2>
                  <div className="px-3 py-1 bg-brand/10 text-brand rounded-full text-[8px] font-black uppercase tracking-widest">
                    {challenge.category}
                  </div>
                </div>

                <p className="text-sm text-text/50 leading-relaxed mb-8">{challenge.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-card p-4 rounded-3xl border border-border">
                    <p className="text-[8px] font-black text-text/40 uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-lg font-black text-text">{challenge.durationDays} Days</p>
                  </div>
                  <div className="bg-card p-4 rounded-3xl border border-border">
                    <p className="text-[8px] font-black text-text/40 uppercase tracking-widest mb-1">Daily Tasks</p>
                    <p className="text-lg font-black text-text">{challenge.tasks.length}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="text-[9px] font-black text-text/40 uppercase tracking-widest">The Roadmap</p>
                  {challenge.tasks.map((task, idx) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border/50">
                      <div className="w-6 h-6 rounded-lg bg-bg flex items-center justify-center text-[10px] font-black text-text/30">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-bold text-text/60">{task.title}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (isJoined) {
                      if (onOpenActive) onOpenActive();
                      else onClose();
                    } else {
                      setStep('terms');
                    }
                  }}
                  className={cn(
                    "w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl",
                    isJoined 
                      ? "bg-emerald-500 text-white" 
                      : "bg-brand text-brand-dark hover:shadow-brand/20 active:scale-95"
                  )}
                >
                  {isJoined ? "Already Enrolled" : "Continue to Join"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="terms"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button 
                  onClick={() => setStep('details')}
                  className="flex items-center gap-2 text-[10px] font-black text-text/30 uppercase tracking-widest mb-6"
                >
                  <ChevronLeft size={14} /> Back to Details
                </button>

                <h3 className="text-xl font-black text-text mb-4">Commitment Terms</h3>
                <div className="space-y-4 mb-8">
                  {challenge.terms && challenge.terms.length > 0 ? (
                    challenge.terms.map((term, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                          <Shield size={16} />
                        </div>
                        <p className="text-xs text-text/60 leading-relaxed">{term}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                          <Calendar size={16} />
                        </div>
                        <p className="text-xs text-text/60 leading-relaxed">
                          I commit to checking in every day for the next <span className="text-text font-bold">{challenge.durationDays} days</span>.
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                          <Target size={16} />
                        </div>
                        <p className="text-xs text-text/60 leading-relaxed">
                          I will complete all <span className="text-text font-bold">{challenge.tasks.length} daily tasks</span> to maintain my streak.
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                          <Shield size={16} />
                        </div>
                        <p className="text-xs text-text/60 leading-relaxed">
                          I understand that discipline is a practice, and I will be honest with my progress.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setHasAcceptedTerms(!hasAcceptedTerms)}
                  className="flex items-center gap-3 mb-8 group"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    hasAcceptedTerms ? "bg-brand border-brand text-brand-dark" : "border-border group-hover:border-brand/50"
                  )}>
                    {hasAcceptedTerms && <CheckCircle2 size={14} />}
                  </div>
                  <span className="text-xs font-bold text-text/60">I accept the terms and commit to this path</span>
                </button>

                <button
                  onClick={onJoin}
                  disabled={!hasAcceptedTerms}
                  className={cn(
                    "w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl",
                    hasAcceptedTerms 
                      ? "bg-brand text-brand-dark hover:shadow-brand/20 active:scale-95"
                      : "bg-text/5 text-text/20 cursor-not-allowed"
                  )}
                >
                  Join Challenge
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ActiveChallengeDetailModal = ({ 
  userChallenge, 
  challenge, 
  onClose, 
  onCheckIn,
  onSendEncouragement
}: { 
  userChallenge: UserChallenge, 
  challenge: Challenge, 
  onClose: () => void, 
  onCheckIn: (taskId: string) => void,
  onSendEncouragement: (targetUserId: string, challengeTitle: string) => void
}) => {
  const [partners, setPartners] = useState<{ uc: UserChallenge, profile: any }[]>([]);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'partners'>('roadmap');
  const [selectedPartner, setSelectedPartner] = useState<{ uc: UserChallenge, profile: any } | null>(null);
  const today = new Date().toLocaleDateString();
  const todayProgress = userChallenge.dailyProgress[today] || { completedTasks: [], percentage: 0 };
  const hasProgressToday = selectedPartner && selectedPartner.uc.dailyProgress[today]?.percentage > 0;
  const isEligibleForClap = selectedPartner && selectedPartner.uc.status === 'active' && hasProgressToday;
  const isDayComplete = todayProgress.percentage >= 100;

  useEffect(() => {
    const partnersQuery = query(
      collection(db, 'user_challenges'),
      where('challengeId', '==', challenge.id),
      where('status', '==', 'active')
    );

    const unsub = onSnapshot(partnersQuery, async (snapshot) => {
      const partnersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as UserChallenge[];
      
      const partnersWithProfiles = await Promise.all(partnersData.map(async (p) => {
        const profileDoc = await getDoc(doc(db, 'profiles', p.user_id));
        return { uc: p, profile: profileDoc.exists() ? profileDoc.data() : { name: 'Unknown User' } };
      }));

      setPartners(partnersWithProfiles);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'user_challenges');
    });

    return () => unsub();
  }, [challenge.id]);

  const recentPartners = [...partners]
    .filter(p => p.uc.lastCheckInDate)
    .sort((a, b) => new Date(b.uc.lastCheckInDate!).getTime() - new Date(a.uc.lastCheckInDate!).getTime())
    .slice(0, 3);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-bg w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onClose} className="p-2 text-text/20 hover:text-text transition-all"><ChevronLeft size={20} /></button>
            <div className="text-center">
              <h2 className="text-lg font-black text-text">{challenge.title}</h2>
              <p className="text-[8px] font-black text-text/20 uppercase tracking-widest">Active Path</p>
            </div>
            <button 
              onClick={() => handleShare(challenge)}
              className="p-2 text-text/20 hover:text-brand transition-all"
            >
              <Share2 size={20} />
            </button>
          </div>

          <div className="flex gap-2 bg-card/50 p-1 rounded-2xl border border-border/50">
            <button
              onClick={() => setActiveTab('roadmap')}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                activeTab === 'roadmap' ? "bg-card text-text shadow-sm" : "text-text/30"
              )}
            >
              Roadmap
            </button>
            <button
              onClick={() => setActiveTab('partners')}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                activeTab === 'partners' ? "bg-card text-text shadow-sm" : "text-text/30"
              )}
            >
              Partners ({partners.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4 min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'roadmap' ? (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Recent Activity Section */}
                {recentPartners.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-2">
                      <Activity size={10} className="text-brand" />
                      <p className="text-[8px] font-black text-text/20 uppercase tracking-widest">Recent Activity</p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {recentPartners.map(partner => (
                        <motion.div 
                          key={partner.uc.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedPartner(partner)}
                          className="bg-card p-3 rounded-2xl border border-border flex items-center gap-3 shrink-0 min-w-[140px] cursor-pointer hover:border-brand/30 transition-all"
                        >
                          <div className="w-8 h-8 rounded-xl bg-bg overflow-hidden border border-border">
                            <img 
                              src={partner.profile.avatar_url || `https://picsum.photos/seed/${partner.uc.user_id}/100/100`} 
                              alt="" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-text truncate max-w-[80px]">{partner.profile.name}</p>
                            <p className="text-[8px] font-bold text-brand">Checked in!</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-card rounded-[2rem] p-6 border border-border shadow-sm">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[8px] font-black text-text/40 uppercase tracking-widest mb-1">Today's Progress</p>
                      <p className="text-2xl font-black text-text">{Math.round(todayProgress.percentage)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-text/40 uppercase tracking-widest mb-1">Streak</p>
                      <div className="flex items-center gap-1 text-brand font-black">
                        <Flame size={16} />
                        {userChallenge.streak} Days
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${todayProgress.percentage}%` }}
                      className="h-full bg-brand rounded-full"
                    />
                  </div>
                </div>

                {isDayComplete ? (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy size={32} />
                    </div>
                    <h4 className="text-lg font-black text-emerald-700 mb-2">Well done!</h4>
                    <p className="text-xs font-bold text-emerald-600/60 leading-relaxed">You've finished your roadmap for today. Your discipline is paying off. Come back tomorrow after 12:00!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {challenge.tasks.map((task) => {
                      const isCompleted = todayProgress.completedTasks.includes(task.id);
                      return (
                        <motion.button
                          key={task.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onCheckIn(task.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all group",
                            isCompleted 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                              : "bg-card border-border/50 text-text/70 hover:border-brand/30 shadow-sm"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                              isCompleted ? "bg-emerald-500 text-white" : "bg-bg text-text/20 group-hover:bg-brand/10 group-hover:text-brand"
                            )}>
                              {isCompleted ? <CheckCircle2 size={20} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </div>
                            <span className={cn(
                              "text-sm font-bold transition-all",
                              isCompleted ? "opacity-40 line-through" : "opacity-100"
                            )}>
                              {task.title}
                            </span>
                          </div>
                          {!isCompleted && (
                            <div className="w-8 h-8 rounded-xl bg-brand/5 text-brand flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                              <PlusCircle size={16} />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="partners"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {partners.length === 0 ? (
                  <div className="text-center py-20">
                    <Users size={32} className="text-text/10 mx-auto mb-4" />
                    <p className="text-xs font-black text-text/20 uppercase tracking-widest">No partners yet</p>
                  </div>
                ) : (
                  partners.map((partner) => {
                    const pToday = partner.uc.dailyProgress[today] || { percentage: 0 };
                    return (
                      <motion.div
                        key={partner.uc.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPartner(partner)}
                        className="bg-card p-4 rounded-3xl border border-border flex items-center justify-between cursor-pointer hover:border-brand/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-bg overflow-hidden border border-border">
                            <img 
                              src={partner.profile.avatar_url || `https://picsum.photos/seed/${partner.uc.user_id}/100/100`} 
                              alt="" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-text">{partner.profile.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-text/20 uppercase tracking-widest">Level {partner.profile.level || 1}</span>
                              <div className="w-1 h-1 bg-text/10 rounded-full" />
                              <div className="flex items-center gap-1 text-[8px] font-black text-brand uppercase tracking-widest">
                                <Flame size={10} />
                                {partner.uc.streak}d
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-brand">{Math.round(pToday.percentage)}%</p>
                          <p className="text-[8px] font-black text-text/20 uppercase tracking-widest">Today</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedPartner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
              onClick={() => setSelectedPartner(null)}
            >
              <motion.div
                className="bg-bg w-full max-w-xs rounded-[3rem] p-8 shadow-2xl text-center"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-20 h-20 rounded-[2rem] bg-brand/10 mx-auto mb-6 overflow-hidden border-4 border-white shadow-lg">
                  <img 
                    src={getAvatarUrl({ 
                      name: selectedPartner.profile.name || '', 
                      gender: selectedPartner.profile.gender, 
                      level: selectedPartner.profile.level || 1 
                    })} 
                    alt="" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="text-xl font-black text-text mb-1">{selectedPartner.profile.name}</h3>
                <p className="text-[10px] font-black text-text/20 uppercase tracking-widest mb-6">Accountability Partner</p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-card p-4 rounded-2xl border border-border">
                    <p className="text-[8px] font-black text-text/40 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-black text-text uppercase">
                      {LEVELS.find(l => l.level === (selectedPartner.profile.level || 1))?.title || 'Initiate'}
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-2xl border border-border">
                    <p className="text-[8px] font-black text-text/40 uppercase tracking-widest mb-1">Claps Earned</p>
                    <p className="text-lg font-black text-brand">{selectedPartner.profile.encouragements_received || 0}</p>
                  </div>
                </div>

                {!isEligibleForClap && (
                  <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3 text-left">
                    <AlertCircle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-bold text-orange-800 leading-relaxed uppercase tracking-wider">
                      Partner must have active progress today to receive a Clap.
                    </p>
                  </div>
                )}

                <button
                  disabled={!isEligibleForClap}
                  onClick={() => {
                    onSendEncouragement(selectedPartner.uc.user_id, challenge.title);
                    setSelectedPartner(null);
                  }}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2",
                    isEligibleForClap 
                      ? "bg-brand text-brand-dark" 
                      : "bg-text/5 text-text/20 cursor-not-allowed grayscale"
                  )}
                >
                  <HandMetal size={16} fill="currentColor" />
                  Applaud Progress
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const CreateChallengeModal = ({ onClose, onCreate }: { onClose: () => void, onCreate: (data: Partial<Challenge>) => void }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(7);
  const [category, setCategory] = useState<'discipline' | 'health' | 'mindset' | 'productivity'>('discipline');
  const [tasks, setTasks] = useState<string[]>(['']);
  const [terms, setTerms] = useState<string[]>(['']);

  const handleAddTask = () => setTasks([...tasks, '']);
  const handleRemoveTask = (idx: number) => setTasks(tasks.filter((_, i) => i !== idx));
  const handleTaskChange = (idx: number, val: string) => {
    const newTasks = [...tasks];
    newTasks[idx] = val;
    setTasks(newTasks);
  };

  const handleAddTerm = () => setTerms([...terms, '']);
  const handleRemoveTerm = (idx: number) => setTerms(terms.filter((_, i) => i !== idx));
  const handleTermChange = (idx: number, val: string) => {
    const newTerms = [...terms];
    newTerms[idx] = val;
    setTerms(newTerms);
  };

  const handleSubmit = () => {
    if (!title || !description || tasks.some(t => !t)) return;
    
    onCreate({
      title,
      description,
      durationDays: duration,
      category,
      tasks: tasks.map((t, i) => ({ id: `task-${i}`, title: t })),
      terms: terms.filter(t => t.trim() !== ''),
      isCustom: true
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-4"
    >
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="bg-bg w-full sm:max-w-md sm:rounded-[3rem] rounded-t-[3rem] overflow-hidden shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh]"
      >
        <header className="p-8 pb-6 flex items-center justify-between border-b border-border/50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-text">Create Challenge</h2>
            <p className="text-[8px] font-black text-text/20 uppercase tracking-[0.2em] mt-1">Design your own path</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-text/5 flex items-center justify-center text-text/40 hover:text-text transition-all"><X size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text/40 uppercase tracking-[0.2em] ml-2">Challenge Title</label>
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Morning Mastery"
              className="w-full p-5 rounded-[1.5rem] bg-card border-2 border-transparent outline-none focus:border-brand/30 focus:bg-card shadow-sm transition-all text-sm font-bold placeholder:text-text/20"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-text/40 uppercase tracking-[0.2em] ml-2">Category</label>
            <div className="grid grid-cols-2 gap-3">
              {['discipline', 'productivity', 'health', 'mindset'].map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c as any)}
                  className={cn(
                    "py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    category === c ? "bg-brand border-brand text-brand-dark shadow-lg shadow-brand/20" : "bg-card border-transparent text-text/40 hover:border-border"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-text/40 uppercase tracking-[0.2em] ml-2">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is the goal of this challenge?"
              className="w-full p-5 rounded-[1.5rem] bg-card border-2 border-transparent outline-none focus:border-brand/30 focus:bg-card shadow-sm transition-all text-sm font-bold h-32 resize-none placeholder:text-text/20"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-text/40 uppercase tracking-[0.2em] ml-2">Duration (Days)</label>
            <div className="flex gap-3">
              {[7, 14, 21, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    "flex-1 py-4 rounded-2xl border-2 text-xs font-black transition-all",
                    duration === d ? "bg-brand border-brand text-brand-dark shadow-lg shadow-brand/20" : "bg-card border-transparent text-text/40 hover:border-border"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-2">
              <label className="text-[10px] font-black text-text/40 uppercase tracking-[0.2em]">Daily Roadmap</label>
              <button 
                onClick={handleAddTask}
                className="text-brand text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:opacity-70 transition-all"
              >
                <PlusCircle size={14} /> Add Task
              </button>
            </div>
            <div className="space-y-3">
              {tasks.map((task, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx} 
                  className="flex gap-2"
                >
                  <input 
                    value={task}
                    onChange={e => handleTaskChange(idx, e.target.value)}
                    placeholder={`Task ${idx + 1}`}
                    className="flex-1 p-5 rounded-[1.5rem] bg-card border-2 border-transparent outline-none focus:border-brand/30 focus:bg-card shadow-sm transition-all text-xs font-bold placeholder:text-text/10"
                  />
                  {tasks.length > 1 && (
                    <button 
                      onClick={() => handleRemoveTask(idx)}
                      className="w-14 h-14 rounded-2xl bg-rose-500/5 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-2">
              <label className="text-[10px] font-black text-text/40 uppercase tracking-[0.2em]">Commitment Terms</label>
              <button 
                onClick={handleAddTerm}
                className="text-brand text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:opacity-70 transition-all"
              >
                <PlusCircle size={14} /> Add Term
              </button>
            </div>
            <div className="space-y-3">
              {terms.map((term, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx} 
                  className="flex gap-2"
                >
                  <input 
                    value={term}
                    onChange={e => handleTermChange(idx, e.target.value)}
                    placeholder={`Term ${idx + 1}`}
                    className="flex-1 p-5 rounded-[1.5rem] bg-card border-2 border-transparent outline-none focus:border-brand/30 focus:bg-card shadow-sm transition-all text-xs font-bold placeholder:text-text/10"
                  />
                  {terms.length > 1 && (
                    <button 
                      onClick={() => handleRemoveTerm(idx)}
                      className="w-14 h-14 rounded-2xl bg-rose-500/5 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 pt-6 border-t border-border/50 bg-bg shrink-0">
          <button
            onClick={handleSubmit}
            className="w-full py-5 bg-brand text-brand-dark rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all"
          >
            Launch Challenge
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
