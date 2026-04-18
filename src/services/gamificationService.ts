import { UserProfile, Badge, Milestone } from '../types';

export const LEVELS = [
  { level: 1, minExp: 0, title: 'Initiate', unlocks: ['Basic Focus', 'Daily Journal'] },
  { level: 2, minExp: 500, title: 'Practitioner', unlocks: ['Mood Insights', 'Identity Badges'] },
  { level: 3, minExp: 1500, title: 'Professional', unlocks: ['Weekly Analytics', 'Verified Status'] },
  { level: 4, minExp: 3500, title: 'Strategist', unlocks: ['Custom Challenges', 'Theme Workshop'] },
  { level: 5, minExp: 7500, title: 'Visionary', unlocks: ['Community Mentor', 'Priority Support'] },
  { level: 6, minExp: 15000, title: 'Master', unlocks: ['Barbaar Elite', 'Legacy Builder'] },
];

export const UNLOCKS = [
  { level: 2, feature: 'mood-insights', label: 'Mood Insights' },
  { level: 2, feature: 'library-access', label: 'Identity Badges' },
  { level: 3, feature: 'analytics', label: 'Weekly Analytics' },
  { level: 4, feature: 'custom-challenges', label: 'Custom Challenges' },
  { level: 5, feature: 'mentor', label: 'Community Mentor' },
  { level: 6, feature: 'elite', label: 'Barbaar Elite' },
];

export const syncAchievements = (profile: UserProfile): string[] => {
  const achievements = [...(profile.achievements || [])];

  // Sync based on current stats for all achievements
  ACHIEVEMENTS.forEach(badge => {
    if (achievements.includes(badge.id)) return;

    switch (badge.id) {
      case '1': // Early Bird
        // This is usually triggered by specific action, but we check if streak > 0 as a proxy if needed
        break;
      case '2': // Mood Master
        // 7 days straight
        if (profile.streak >= 7) achievements.push('2');
        break;
      case '3': // Deep Thinker
        if (profile.totalWordCount >= 1000) achievements.push('3');
        break;
      case '4': // Growth Seeker
        if (profile.dailyWins >= 10) achievements.push('4');
        break;
      case '5': // Sabr Master
        if (profile.sabrPoints >= 1000 || profile.points >= 1000) achievements.push('5');
        break;
      case '6': // Focus Warrior
        if (profile.focusTimeTotal >= 18000) achievements.push('6');
        break;
    }
  });

  return achievements;
};

export const calculateLevel = (exp: number) => {
  let currentLevel = LEVELS[0];
  for (const l of LEVELS) {
    if (exp >= l.minExp) {
      currentLevel = l;
    } else {
      break;
    }
  }
  return currentLevel;
};

export const getNextLevelExp = (currentLevel: number) => {
  const nextLevel = LEVELS.find(l => l.level === currentLevel + 1);
  return nextLevel ? nextLevel.minExp : Infinity;
};

export const checkUnlocks = (level: number): string[] => {
  return UNLOCKS.filter(u => level >= u.level).map(u => u.feature);
};

export const SABR_POINTS_CONFIG = {
  TASK_COMPLETE: 50,
  FOCUS_SESSION: 50,
  JOURNAL_ENTRY: 50,
  ARTICLE_READ: 50,
  COMMUNITY_INTERACTION: 10,
  MOOD_LOG: 25,
  STREAK_BONUS: 50,
  CHALLENGE_CHECKIN: 40,
};

export const XP_CONFIG = {
  TASK_COMPLETE: 100,
  FOCUS_SESSION: 100,
  JOURNAL_ENTRY: 100,
  ARTICLE_READ: 100,
  COMMUNITY_INTERACTION: 50,
  MOOD_LOG: 50,
  STREAK_BONUS: 100,
  CHALLENGE_CHECKIN: 80,
};

export const ACHIEVEMENTS: Badge[] = [
  { id: '1', name: 'Early Bird', icon: '🌅', description: 'Complete a task before 9 AM', unlocked: false, category: 'consistency', progress: 0, maxProgress: 1 },
  { id: '2', name: 'Mood Master', icon: '🧘', description: 'Log your mood for 7 days straight', unlocked: false, category: 'mindset', progress: 0, maxProgress: 7 },
  { id: '3', name: 'Deep Thinker', icon: '🧠', description: 'Write 1,000 words in your journal', unlocked: false, category: 'mindset', progress: 0, maxProgress: 1000 },
  { id: '4', name: 'Growth Seeker', icon: '🌱', description: 'Complete 10 tasks', unlocked: false, category: 'growth', progress: 0, maxProgress: 10 },
  { id: '5', name: 'Sabr Master', icon: '💎', description: 'Reach 1,000 Sabr Points', unlocked: false, category: 'growth', progress: 0, maxProgress: 1000 },
  { id: '6', name: 'Focus Warrior', icon: '⚔️', description: 'Spend 5 hours in deep focus', unlocked: false, category: 'mindset', progress: 0, maxProgress: 18000 },
];

export const calculateGrowthScore = (profile: UserProfile): number => {
  const streakWeight = 0.3;
  const pointsWeight = 0.4;
  const resourceWeight = 0.3;

  const streakScore = Math.min((profile.streak + profile.journalStreak) / 20, 1) * 100;
  const pointsScore = Math.min(profile.sabrPoints / 5000, 1) * 100;
  const resourceScore = Math.min(profile.completedResources.length / 10, 1) * 100;

  return Math.round(
    streakScore * streakWeight +
    pointsScore * pointsWeight +
    resourceScore * resourceWeight
  );
};

export const checkVariableReward = (profile: UserProfile): { bonusPoints: number; message: string } | null => {
  const today = new Date().toLocaleDateString();
  if (profile.lastRewardDate === today) return null;

  // 20% chance of a surprise reward
  if (Math.random() < 0.2) {
    const rewards = [
      { points: 100, msg: "Surprise! You've earned 100 bonus Sabr points for your consistency." },
      { points: 50, msg: "A small gift for your dedication: 50 bonus points!" },
      { points: 200, msg: "Incredible progress! Here's a 200 point boost." },
    ];
    return {
      bonusPoints: rewards[Math.floor(Math.random() * rewards.length)].points,
      message: rewards[Math.floor(Math.random() * rewards.length)].msg,
    };
  }
  return null;
};

export const getAvatarUrl = (user: { name: string; gender?: string; level: number }) => {
  const seed = `${user.name}-${user.gender || 'neutral'}`;
  // Professional styles that evolve:
  // Level 1-2: Simple minimalist
  // Level 3-4: Detailed avatar
  // Level 5-6: Detailed with background/accessories
  const accessories = user.level >= 4 ? '&accessoriesProbability=100' : '&accessoriesProbability=0';
  const clothing = user.level >= 3 ? '&clothingGraphicProbability=100' : '&clothingGraphicProbability=0';
  const style = 'avataaars';
  
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}${accessories}${clothing}`;
};
export const updateGamification = (
  profile: UserProfile,
  action: keyof typeof XP_CONFIG,
  metadata?: { wordCount?: number }
): Partial<UserProfile> => {
  const xpGain = XP_CONFIG[action];
  const sabrGain = SABR_POINTS_CONFIG[action];

  let newExp = profile.experience + xpGain;
  let newSabr = profile.sabrPoints + sabrGain;
  let newPoints = profile.points + xpGain; // General points
  let newTotalWordCount = profile.totalWordCount + (metadata?.wordCount || 0);
  
  // Variable reward check
  const variableReward = checkVariableReward(profile);
  if (variableReward) {
    newSabr += variableReward.bonusPoints;
  }

  const currentLevelInfo = calculateLevel(newExp);
  const newLevel = currentLevelInfo.level;
  const nextLevelExp = getNextLevelExp(newLevel);
  const unlockedFeatures = checkUnlocks(newLevel);

  // Check for achievements
  const newAchievements = [...(profile.achievements || [])];
  
  // Example logic for Sabr Master
  if ((newSabr >= 1000 || newPoints >= 1000) && !newAchievements.includes('5')) {
    newAchievements.push('5');
  }

  // Deep Thinker: 1000 words
  if (newTotalWordCount >= 1000 && !newAchievements.includes('3')) {
    newAchievements.push('3');
  }

  const updatedProfile: Partial<UserProfile> = {
    experience: newExp,
    sabrPoints: newSabr,
    sabrPointsToday: (profile.sabrPointsToday || 0) + sabrGain + (variableReward?.bonusPoints || 0),
    points: newPoints,
    level: newLevel,
    nextLevelExp: nextLevelExp,
    unlockedFeatures: unlockedFeatures,
    achievements: newAchievements,
    totalWordCount: newTotalWordCount,
    lastRewardDate: new Date().toLocaleDateString(),
  };

  // Recalculate growth score
  updatedProfile.growthScore = calculateGrowthScore({ ...profile, ...updatedProfile } as UserProfile);

  return updatedProfile;
};
