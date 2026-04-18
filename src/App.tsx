import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sparkles, Loader2 } from 'lucide-react';
import { MoodTracker } from './components/MoodTracker';
import { ProgressCard } from './components/ProgressCard';
import { QuickActions } from './components/QuickActions';
import { TaskList } from './components/TaskList';
import { BottomNav } from './components/BottomNav';
import { TherapyView } from './components/TherapyView';
import { JournalView } from './components/JournalView';
import { ProfileView } from './components/ProfileView';
import { ResourceView } from './components/ResourceView';
import { ResourceReader } from './components/ResourceReader';
import { DailyInsight } from './components/DailyInsight';
import { EmergencyMode } from './components/EmergencyMode';
import { AddTaskModal } from './components/AddTaskModal';
import { HomeView } from './components/HomeView';
import { NasashoView } from './components/NasashoView';
import { ChallengesView } from './components/ChallengesView';
import { MoodCheckInOverlay } from './components/MoodCheckInOverlay';
import { AdminDashboard } from './components/AdminDashboard';
import { AchievementUnlockOverlay } from './components/AchievementUnlockOverlay';
import { AppState, Mood, ViewType, ThemeType, Task, JournalEntry, Badge, Milestone, Priority, Booking, Resource, UserProfile, AppNotification, FirestoreProfile, FirestoreTask, FirestoreJournalEntry, FirestoreMoodLog, MoodLog, Challenge, UserChallenge } from './types';
import { updateGamification, XP_CONFIG, SABR_POINTS_CONFIG, ACHIEVEMENTS, syncAchievements, checkUnlocks } from './services/gamificationService';
import { AnimatePresence, motion } from 'motion/react';
import { arrayMove } from '@dnd-kit/sortable';
import { auth, db, onAuthStateChanged, signOut, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, handleFirestoreError, OperationType } from './firebase';
import { Auth } from './components/Auth';
import { FocusTimer } from './components/FocusTimer';

const INITIAL_BADGES: Badge[] = [
  { id: '1', name: 'Early Bird', icon: '🌅', description: 'Complete a task before 9 AM', unlocked: true, category: 'consistency', progress: 1, maxProgress: 1 },
  { id: '2', name: 'Mood Master', icon: '🧘', description: 'Log your mood for 7 days straight', unlocked: true, category: 'mindset', progress: 7, maxProgress: 7 },
  { id: '3', name: 'Deep Thinker', icon: '🧠', description: 'Write 1,000 words in your journal', unlocked: false, category: 'mindset', progress: 0, maxProgress: 1000 },
  { id: '4', name: 'Growth Seeker', icon: '🌱', description: 'Complete 10 tasks', unlocked: false, category: 'growth', progress: 2, maxProgress: 10 },
  { id: '6', name: 'Night Owl', icon: '🦉', description: 'Complete a task after 10 PM', unlocked: false, category: 'consistency', progress: 0, maxProgress: 1 },
  { id: '8', name: 'Zen Master', icon: '🏮', description: 'Complete 5 therapy sessions', unlocked: false, category: 'mindset', progress: 0, maxProgress: 5 },
];

const INITIAL_MILESTONES: Milestone[] = [
  { id: '1', title: 'First Steps', description: 'Reach 500 Sabr Points', targetPoints: 500, reward: 'New Avatar Frame', achieved: true },
  { id: '2', title: 'Steady Path', description: 'Reach 2,000 Sabr Points', targetPoints: 2000, reward: 'Custom Theme', achieved: false },
  { id: '3', title: 'Mountain Peak', description: 'Reach 5,000 Sabr Points', targetPoints: 5000, reward: 'Premium Resources', achieved: false },
];

const INITIAL_STATE: AppState = {
  view: 'home',
  theme: 'light',
  session: null,
  notifications: [
    { id: '1', type: 'achievement', title: 'Welcome!', content: 'You earned 50 Sabr points for joining.', timestamp: new Date().toISOString(), read: false, icon: '🎉' },
  ],
  user: {
    id: '',
    name: 'Alex',
    level: 1,
    experience: 0,
    nextLevelExp: 500,
    streak: 0,
    journalStreak: 0,
    points: 0,
    sabrPoints: 0,
    growthScore: 0,
    focusTimeTotal: 0,
    focusTimeToday: 0,
    dailyWins: 0,
    totalWins: 0,
    sabrPointsToday: 0,
    hasCheckedIn: false,
    moodLogCountToday: 0,
    encouragementsReceived: 0,
    unlockedFeatures: [],
    achievements: [],
    language: 'en',
    completedResources: [],
    savedResources: [],
    totalWordCount: 0,
    tasks: [],
    journalEntries: [],
    moodLogs: [],
    badges: INITIAL_BADGES,
    milestones: INITIAL_MILESTONES,
    bookings: [],
    userChallenges: []
  }
};

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'morning-routine',
    title: '7 Days Morning Mastery',
    description: 'Establish a rock-solid morning routine to conquer your day. Wake up early, hydrate, and move.',
    durationDays: 7,
    category: 'discipline',
    participantsCount: 1240,
    published: true,
    tasks: [
      { id: 'wake-up', title: 'Wake up before 6:00 AM' },
      { id: 'hydrate', title: 'Drink 500ml of water' },
      { id: 'move', title: '10 minutes of movement' }
    ]
  },
  {
    id: 'habit-formation',
    title: '21 Days Habit Forge',
    description: 'Science says it takes 21 days to form a habit. Choose one habit and stick to it relentlessly.',
    durationDays: 21,
    category: 'productivity',
    participantsCount: 850,
    published: true,
    tasks: [
      { id: 'deep-work', title: '90 minutes of Deep Work' },
      { id: 'read', title: 'Read 10 pages of a book' },
      { id: 'reflect', title: 'Evening reflection' }
    ]
  }
];

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isJournalWriting, setIsJournalWriting] = useState(false);
  const [focusingTaskId, setFocusingTaskId] = useState<string | null>(null);
  const [initialChallengeId, setInitialChallengeId] = useState<string | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Badge | null>(null);
  const unsubscribesRef = useRef<(() => void)[]>([]);

  // Task Reminders Effect
  useEffect(() => {
    if (!state.session || !state.user.tasks.length) return;

    const checkReminders = () => {
      const now = new Date();
      state.user.tasks.forEach(task => {
        if (task.completed || !task.dueDate) return;
        
        const dueDate = new Date(task.dueDate);
        const diffMs = dueDate.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        // Notify at 15m, 10m, 5m, and 0m
        const thresholds = [15, 10, 5, 0];
        if (thresholds.includes(diffMins)) {
          const notifiedKey = `notified_${task.id}_${dueDate.getTime()}_${diffMins}`;
          if (!localStorage.getItem(notifiedKey)) {
            const title = diffMins === 0 ? 'Focus Time Now!' : 'Upcoming Focus';
            const content = diffMins === 0 
              ? `Time to start: "${task.title}"`
              : `"${task.title}" starts in ${diffMins} minutes. Ready?`;
            
            addNotification({
              type: 'reminder',
              title,
              content,
              icon: diffMins === 0 ? '🎯' : '⏰'
            });
            localStorage.setItem(notifiedKey, 'true');
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Initial check
    return () => clearInterval(interval);
  }, [state.user.tasks, state.session]);

  const cleanupUnsubscribes = () => {
    unsubscribesRef.current.forEach(unsub => unsub());
    unsubscribesRef.current = [];
  };

  useEffect(() => {
    // Listen for auth changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setState(prev => ({ ...prev, session: user }));
      if (user) {
        fetchUserData(user.uid);
      } else {
        cleanupUnsubscribes();
        setState(INITIAL_STATE);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      cleanupUnsubscribes();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challengeId = params.get('challengeId');
    if (challengeId) {
      setInitialChallengeId(challengeId);
      setState(prev => ({ ...prev, view: 'challenges' }));
      // Clear the param from URL without reloading
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const addNotification = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications].slice(0, 20), // Keep last 20
    }));
  };

  const handleMarkNotificationRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  };

  const handleClearNotifications = () => {
    setState(prev => ({ ...prev, notifications: [] }));
  };

  const mapTaskFromFirestore = (doc: any): Task => {
    const data = doc.data() as FirestoreTask;
    return {
      id: doc.id,
      title: data.title,
      time: data.time,
      completed: data.completed,
      priority: data.priority,
      dueDate: data.due_date,
      createdAt: data.created_at?.toDate?.()?.toISOString() || (typeof data.created_at === 'string' ? data.created_at : new Date().toISOString()),
      focusTimeSpent: data.focus_time_spent || 0
    };
  };

  const fetchUserData = async (userId: string) => {
    if (!userId) return;
    cleanupUnsubscribes();
    setLoading(true);
    
    try {
      // Fetch Profile
      const docRef = doc(db, 'profiles', userId);
      let docSnap;
      
      try {
        docSnap = await getDoc(docRef);
      } catch (e: any) {
        // If it's a network error, try to get from cache if available or just continue
        if (e.message?.includes('offline') || e.code === 'unavailable') {
          console.warn('Working in offline mode - some data may be stale');
        }
        // Attempt to get from server specifically if it failed initially
        docSnap = await getDoc(docRef); 
      }

      if (!docSnap.exists()) {
        const today = new Date().toLocaleDateString();
        const newProfile: FirestoreProfile = { 
          name: auth.currentUser?.displayName || 'New User',
          level: 1,
          experience: 0,
          next_level_exp: 500,
          streak: 1, // Start with streak of 1
          journal_streak: 0,
          points: 0,
          sabr_points: 0,
          sabr_points_today: 0,
          growth_score: 0,
          focus_time_total: 0,
          focus_time_today: 0,
          daily_wins: 0,
          total_wins: 0,
          has_checked_in: false,
          mood_log_count_today: 0,
          encouragements_received: 0,
          last_mood_log_date: '',
          last_active_date: today,
          unlocked_features: [],
          achievements: [],
          language: 'en',
          gender: 'other', // Default to other, will try to infer if needed
          completed_resources: [],
          saved_resources: [],
          updated_at: serverTimestamp()
        };
        await setDoc(docRef, newProfile);
        updateUserState({ ...newProfile, id: userId });
      } else {
        const data = docSnap.data() as FirestoreProfile;
        const today = new Date().toLocaleDateString();
        const isNewDay = data.last_active_date !== today;
        
        if (isNewDay) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString();
          
          const isYesterday = data.last_active_date === yesterdayStr;
          let newStreak = data.streak || 0;
          
          if (isYesterday) {
            newStreak += 1;
          } else {
            newStreak = 1; // Reset to 1 for the new active day
          }

          const resetData: FirestoreProfile = {
            ...data,
            streak: newStreak,
            sabr_points_today: 0,
            focus_time_today: 0,
            daily_wins: 0,
            has_checked_in: false,
            mood_log_count_today: 0,
            last_active_date: today
          };
          await updateDoc(docRef, {
            streak: newStreak,
            sabr_points_today: 0,
            focus_time_today: 0,
            daily_wins: 0,
            has_checked_in: false,
            mood_log_count_today: 0,
            last_active_date: today
          });
          updateUserState({ ...resetData, id: userId });
        } else {
          updateUserState({ ...data, id: userId });
        }
      }

      // Fetch Tasks
      if (!userId) return;
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      
      const tasksUnsub = onSnapshot(tasksQuery, (snapshot) => {
        const tasks = snapshot.docs.map(mapTaskFromFirestore);
        setState(prev => ({
          ...prev,
          user: { ...prev.user, tasks }
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'tasks');
      });
      unsubscribesRef.current.push(tasksUnsub);

      // Fetch Journal Entries
      if (!userId) return;
      const journalQuery = query(
        collection(db, 'journal_entries'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );

      const journalUnsub = onSnapshot(journalQuery, (snapshot) => {
        const journalEntries = snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            created_at: data.created_at, // Keep original for updates
            createdAt: data.created_at?.toDate?.()?.toISOString() || (typeof data.created_at === 'string' ? data.created_at : new Date().toISOString())
          };
        }) as JournalEntry[];
        setState(prev => ({
          ...prev,
          user: { ...prev.user, journalEntries }
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'journal_entries');
      });
      unsubscribesRef.current.push(journalUnsub);

      // Fetch Mood Logs
      if (!userId) return;
      const moodQuery = query(
        collection(db, 'mood_logs'),
        where('user_id', '==', userId),
        orderBy('date', 'desc')
      );

      const moodUnsub = onSnapshot(moodQuery, (snapshot) => {
        const moodLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MoodLog[];
        setState(prev => ({
          ...prev,
          user: { ...prev.user, moodLogs }
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'mood_logs');
      });
      unsubscribesRef.current.push(moodUnsub);
      
      // Fetch Notifications
      if (!userId) return;
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );

      const notificationsUnsub = onSnapshot(notificationsQuery, (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            content: data.content || data.message || '',
            timestamp: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
          };
        }) as AppNotification[];
        setState(prev => ({
          ...prev,
          notifications
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      });
      unsubscribesRef.current.push(notificationsUnsub);

      // Fetch Challenges
      const challengesUnsub = onSnapshot(collection(db, 'challenges'), (snapshot) => {
        const fetchedChallenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Challenge[];
        if (fetchedChallenges.length > 0) {
          setChallenges(fetchedChallenges);
        } else {
          // Seed initial challenges if empty
          INITIAL_CHALLENGES.forEach(async (c) => {
            await setDoc(doc(db, 'challenges', c.id), c);
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'challenges');
      });
      unsubscribesRef.current.push(challengesUnsub);

      // Fetch User Challenges
      const userChallengesQuery = query(
        collection(db, 'user_challenges'),
        where('user_id', '==', userId),
        where('status', '==', 'active')
      );
      const userChallengesUnsub = onSnapshot(userChallengesQuery, (snapshot) => {
        const userChallenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserChallenge[];
        setState(prev => ({
          ...prev,
          user: { ...prev.user, userChallenges }
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'user_challenges');
      });
      unsubscribesRef.current.push(userChallengesUnsub);

    } catch (userErr) {
      console.error('Error fetching user data:', userErr);
      addNotification({
        type: 'achievement',
        title: 'Connection Issue',
        content: 'We are having trouble reaching the server. Some features may be limited.',
        icon: '⚠️'
      });
    } finally {
      setLoading(false);
    }
  };

  const mapToFirestore = (updates: Partial<UserProfile>): FirestoreProfile => {
    const firestoreUpdates: FirestoreProfile = {};
    const mapping: Record<string, keyof FirestoreProfile> = {
      avatarUrl: 'avatar_url',
      nextLevelExp: 'next_level_exp',
      journalStreak: 'journal_streak',
      sabrPoints: 'sabr_points',
      sabrPointsToday: 'sabr_points_today',
      growthScore: 'growth_score',
      focusTimeTotal: 'focus_time_total',
      focusTimeToday: 'focus_time_today',
      dailyWins: 'daily_wins',
      totalWins: 'total_wins',
      hasCheckedIn: 'has_checked_in',
      moodLogCountToday: 'mood_log_count_today',
      lastMoodLogDate: 'last_mood_log_date',
      unlockedFeatures: 'unlocked_features',
      completedResources: 'completed_resources',
      savedResources: 'saved_resources',
      encouragementsReceived: 'encouragements_received',
      lastActiveDate: 'last_active_date',
      lastRewardDate: 'last_reward_date',
      totalWordCount: 'total_word_count'
    };

    Object.entries(updates).forEach(([key, value]) => {
      const firestoreKey = mapping[key] || key as keyof FirestoreProfile;
      (firestoreUpdates as any)[firestoreKey] = value;
    });

    return firestoreUpdates;
  };

  const mapFromFirestore = (data: any): Partial<UserProfile> => {
    const profile: any = {};
    const mapping: Record<string, keyof UserProfile> = {
      avatar_url: 'avatarUrl',
      next_level_exp: 'nextLevelExp',
      journal_streak: 'journalStreak',
      sabr_points: 'sabrPoints',
      sabr_points_today: 'sabrPointsToday',
      growth_score: 'growthScore',
      focus_time_total: 'focusTimeTotal',
      focus_time_today: 'focusTimeToday',
      daily_wins: 'dailyWins',
      total_wins: 'totalWins',
      has_checked_in: 'hasCheckedIn',
      mood_log_count_today: 'moodLogCountToday',
      last_mood_log_date: 'lastMoodLogDate',
      unlocked_features: 'unlockedFeatures',
      completed_resources: 'completedResources',
      saved_resources: 'savedResources',
      encouragements_received: 'encouragementsReceived',
      last_active_date: 'lastActiveDate',
      last_reward_date: 'lastRewardDate',
      total_word_count: 'totalWordCount'
    };

    Object.entries(data).forEach(([key, value]) => {
      const camelKey = mapping[key] || key as keyof UserProfile;
      profile[camelKey] = value;
    });

    return profile;
  };

  const updateUserState = (profile: any) => {
    const mappedProfile = mapFromFirestore(profile) as UserProfile;
    
    // Ensure achievements and unlocks are in sync with current stats
    const currentAchievements = syncAchievements(mappedProfile);
    const currentUnlocks = checkUnlocks(mappedProfile.level);
    
    const needsSync = 
      JSON.stringify(currentAchievements) !== JSON.stringify(mappedProfile.achievements) ||
      JSON.stringify(currentUnlocks) !== JSON.stringify(mappedProfile.unlockedFeatures);

    const finalProfile = {
      ...mappedProfile,
      achievements: currentAchievements,
      unlockedFeatures: currentUnlocks,
      id: profile.id || state.user.id,
      name: profile.name || state.user.name,
    };

    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        ...finalProfile
      }
    }));

    // If we detected missing achievements or unlocks, sync them back to Firestore
    if (needsSync && state.session) {
      syncProfile({
        achievements: currentAchievements,
        unlockedFeatures: currentUnlocks
      });
    }
  };

  const syncProfile = async (updates: Partial<UserProfile>) => {
    if (!state.session) return;
    try {
      const docRef = doc(db, 'profiles', state.session.uid);
      const firestoreUpdates = {
        ...mapToFirestore(updates),
        updated_at: serverTimestamp()
      };
      await updateDoc(docRef, firestoreUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${state.session.uid}`);
    }
  };

  const handleViewChange = (view: ViewType, params?: any) => {
    setState(prev => ({ ...prev, view, viewParams: params }));
  };

  const handleGamificationUpdate = (action: keyof typeof XP_CONFIG, metadata?: { wordCount?: number }) => {
    const updates = updateGamification(state.user, action, metadata);
    updateUserState(updates);
    syncProfile(updates);
    
    // Check for level up notification
    if (updates.level && updates.level > state.user.level) {
      addNotification({
        type: 'achievement',
        title: 'Level Up!',
        content: `Congratulations! You've reached Level ${updates.level}.`,
        icon: '🎉'
      });
    }

    // Check for new achievements
    const newAchievements = updates.achievements?.filter(a => !state.user.achievements.includes(a)) || [];
    newAchievements.forEach(id => {
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        addNotification({
          type: 'achievement',
          title: 'Achievement Unlocked!',
          content: `You've earned the "${achievement.name}" badge!`,
          icon: achievement.icon
        });
        // Set state for unlock animation
        setUnlockedAchievement(achievement);
      }
    });
  };

  const handleSelectMood = async (mood: Mood) => {
    if (!state.session) return;

    const now = new Date();
    const isoDate = now.toISOString();
    const newCount = state.user.moodLogCountToday + 1;

    // Limit to 2 logs per day for points
    const shouldAwardPoints = newCount <= 2;

    const moodLog = {
      user_id: state.session.uid,
      date: isoDate,
      mood,
      created_at: serverTimestamp()
    };

    try {
      // Don't await here to keep the UI snappy
      addDoc(collection(db, 'mood_logs'), moodLog).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, 'mood_logs');
      });
      
      addNotification({
        type: 'achievement',
        title: 'Mood Logged',
        content: `You earned ${shouldAwardPoints ? 25 : 0} Sabr points for checking in.`,
        icon: '🧘'
      });
    } catch (error) {
      console.error('Error logging mood:', error);
    }

    if (shouldAwardPoints) {
      handleGamificationUpdate('MOOD_LOG');
    }

    const finalProfileUpdates = {
      mood,
      hasCheckedIn: true,
      lastMoodLogDate: isoDate,
      moodLogCountToday: newCount,
    };
    
    syncProfile(finalProfileUpdates as any);

    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        ...finalProfileUpdates,
        moodLogs: [{ id: `mood-${Date.now()}`, userId: state.session?.uid || '', date: isoDate, mood }, ...prev.user.moodLogs]
      }
    }));
  };

  const shouldShowMoodPopup = () => {
    const hour = new Date().getHours();
    const isEvening = hour >= 18;
    
    if (state.user.moodLogCountToday === 0) return true;
    
    if (state.user.moodLogCountToday === 1 && isEvening) {
      if (state.user.lastMoodLogDate) {
        const lastLog = new Date(state.user.lastMoodLogDate);
        const now = new Date();
        const diffHours = (now.getTime() - lastLog.getTime()) / (1000 * 60 * 60);
        return diffHours > 4;
      }
      return true;
    }
    
    return false;
  };

  const handleToggleTask = async (id: string) => {
    const task = state.user.tasks.find(t => t.id === id);
    if (!task) return;

    // Optimistically update UI first to prevent double-tap feeling
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        tasks: prev.user.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      }
    }));

    if (state.session) {
      try {
        await updateDoc(doc(db, 'tasks', id), { completed: !task.completed });
        if (!task.completed) {
          handleGamificationUpdate('TASK_COMPLETE');
          const totalWins = (state.user.totalWins || 0) + 1;
          syncProfile({ totalWins } as any);
          setState(prev => ({ 
            ...prev, 
            user: { ...prev.user, totalWins } 
          }));
          addNotification({
            type: 'achievement',
            title: 'Task Completed',
            content: `Great job! "${task.title}" is done. +50 Sabr points.`,
            icon: '✅'
          });
        }
      } catch (error) {
        // Rollback on error
        setState(prev => ({
          ...prev,
          user: {
            ...prev.user,
            tasks: prev.user.tasks.map(t => t.id === id ? { ...t, completed: task.completed } : t)
          }
        }));
        handleFirestoreError(error, OperationType.UPDATE, 'tasks');
      }
    }
  };

  const handleStartFocus = (id: string) => {
    setFocusingTaskId(id);
  };

  const handleFocusComplete = async (timeSpent: number) => {
    if (!focusingTaskId || !state.session) return;

    const task = state.user.tasks.find(t => t.id === focusingTaskId);
    if (task) {
      try {
        await updateDoc(doc(db, 'tasks', focusingTaskId), { 
          completed: true, 
          completed_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          focus_time_spent: (task.focusTimeSpent || 0) + timeSpent
        });
        addNotification({
          type: 'achievement',
          title: 'Focus Session',
          content: `You focused for ${Math.floor(timeSpent / 60)} minutes. +50 Sabr points.`,
          icon: '⏱️'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'tasks');
      }
    }

    const updates = updateGamification(state.user, 'FOCUS_SESSION');
    const finalUpdates = {
      ...updates,
      focus_time_total: (state.user.focusTimeTotal || 0) + timeSpent,
      focus_time_today: (state.user.focusTimeToday || 0) + timeSpent,
      daily_wins: (state.user.dailyWins || 0) + 1,
      total_wins: (state.user.totalWins || 0) + 1,
      sabr_points: updates.sabrPoints,
      next_level_exp: updates.nextLevelExp,
      unlocked_features: updates.unlockedFeatures
    };
    
    syncProfile(finalUpdates as any);

    setState(prev => {
      const newTasks = prev.user.tasks.map(t => 
        t.id === focusingTaskId 
          ? { 
              ...t, 
              completed: true, 
              completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
              focusTimeSpent: (t.focusTimeSpent || 0) + timeSpent 
            } 
          : t
      );

      return {
        ...prev,
        user: {
          ...prev.user,
          ...updates,
          focusTimeTotal: (prev.user.focusTimeTotal || 0) + timeSpent,
          focusTimeToday: (prev.user.focusTimeToday || 0) + timeSpent,
          dailyWins: (prev.user.dailyWins || 0) + 1,
          totalWins: (prev.user.totalWins || 0) + 1,
          tasks: newTasks
        }
      };
    });
    setFocusingTaskId(null);
  };

  const handleDeleteTask = async (id: string) => {
    if (state.session) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'tasks');
      }
    }
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        tasks: prev.user.tasks.filter(t => t.id !== id)
      }
    }));
  };

  const handleReorderTasks = (activeId: string, overId: string) => {
    setState(prev => {
      const oldIndex = prev.user.tasks.findIndex(t => t.id === activeId);
      const newIndex = prev.user.tasks.findIndex(t => t.id === overId);
      return {
        ...prev,
        user: {
          ...prev.user,
          tasks: arrayMove(prev.user.tasks, oldIndex, newIndex)
        }
      };
    });
  };

  const handleAddTask = async (title: string, time: string, priority: Priority, dueDate: string) => {
    const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTask: Task = {
      id: newId,
      title,
      time,
      completed: false,
      priority,
      dueDate,
      createdAt: new Date().toISOString(),
      focusTimeSpent: 0
    };

    if (state.session) {
      try {
        const docRef = await addDoc(collection(db, 'tasks'), {
          user_id: state.session.uid,
          title,
          time,
          priority,
          due_date: dueDate,
          created_at: serverTimestamp(),
          completed: false,
          focus_time_spent: 0
        });
        
        setFocusingTaskId(docRef.id);
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'tasks');
      }
    }

    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        tasks: [newTask, ...prev.user.tasks]
      }
    }));
    setFocusingTaskId(newId);
  };

  const handleAddJournal = async (content: string, mood?: Mood): Promise<string> => {
    if (!state.session) return '';

    const newEntry = {
      user_id: state.session.uid,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content,
      mood: mood || state.user.mood,
      created_at: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, 'journal_entries'), newEntry);
      
      const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
      handleGamificationUpdate('JOURNAL_ENTRY', { wordCount });

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'journal_entries');
      return '';
    }
  };

  const handleUpdateJournal = async (id: string, content: string, mood?: Mood) => {
    if (!state.session) return;

    const entry = state.user.journalEntries.find(e => e.id === id);
    if (!entry) return;

    const oldWordCount = entry.content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const newWordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const diff = newWordCount - oldWordCount;

    try {
      await updateDoc(doc(db, 'journal_entries', id), {
        content,
        mood: mood || entry.mood,
        updated_at: serverTimestamp()
      });

      // Update word count in gamification without adding XP again
      const updates = updateGamification(state.user, 'JOURNAL_ENTRY', { wordCount: diff });
      delete updates.experience;
      delete updates.points;
      delete updates.sabrPoints;
      
      updateUserState(updates);
      syncProfile(updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'journal_entries');
    }
  };

  const handleToggleLanguage = () => {
    const newLang = state.user.language === 'en' ? 'so' : 'en';
    setState(prev => ({
      ...prev,
      user: { ...prev.user, language: newLang }
    }));
    if (state.session?.uid) {
      updateDoc(doc(db, 'profiles', state.session.uid), { language: newLang }).catch(error => {
        handleFirestoreError(error, OperationType.UPDATE, `profiles/${state.session?.uid}`);
      });
    }
  };

  const handleCompleteResource = (resourceId: string) => {
    if (state.user.completedResources.includes(resourceId)) return;

    const newCompleted = [...state.user.completedResources, resourceId];
    const gamificationUpdate = updateGamification(state.user, 'ARTICLE_READ');
    
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        ...gamificationUpdate,
        completedResources: newCompleted
      }
    }));

    if (state.session?.uid) {
      updateDoc(doc(db, 'profiles', state.session.uid), {
        experience: gamificationUpdate.experience,
        sabr_points: gamificationUpdate.sabrPoints,
        points: gamificationUpdate.points,
        level: gamificationUpdate.level,
        next_level_exp: gamificationUpdate.nextLevelExp,
        unlocked_features: gamificationUpdate.unlockedFeatures,
        achievements: gamificationUpdate.achievements,
        completed_resources: newCompleted,
        growth_score: gamificationUpdate.growthScore
      }).catch(error => {
        handleFirestoreError(error, OperationType.UPDATE, `profiles/${state.session?.uid}`);
      });
    }
  };

  const handleReadResource = async (resource: Resource) => {
    if (!state.session) return;

    const isAlreadyCompleted = state.user.completedResources?.includes(resource.id);
    const completedResources = isAlreadyCompleted 
      ? state.user.completedResources 
      : [...(state.user.completedResources || []), resource.id];

    const updates = updateGamification(state.user, 'ARTICLE_READ');
    const finalUpdates = {
      ...updates,
      completed_resources: completedResources,
      daily_wins: state.user.dailyWins + 1,
      total_wins: (state.user.totalWins || 0) + 1,
      sabr_points: updates.sabrPoints,
      next_level_exp: updates.nextLevelExp,
      unlocked_features: updates.unlockedFeatures
    };

    syncProfile(finalUpdates as any);

    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        ...updates,
        completedResources,
        dailyWins: prev.user.dailyWins + 1
      }
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setState(INITIAL_STATE);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBookTherapist = (booking: Booking) => {
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        bookings: [...prev.user.bookings, booking]
      }
    }));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const handleThemeChange = (theme: ThemeType) => {
    setState(prev => ({ ...prev, theme }));
  };

  const completedCount = state.user.tasks.filter(t => t.completed).length;
  const totalCount = state.user.tasks.length > 8 ? state.user.tasks.length : 8;

  const todayDate = new Date();
  const hour = todayDate.getHours();
  let greeting = 'Hey';
  if (hour < 12) greeting = 'Maalin wanaagsan'; // Good morning/day
  else if (hour < 18) greeting = 'Galab wanaagsan'; // Good afternoon
  else greeting = 'Habeen wanaagsan'; // Good evening

  const dateString = todayDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleEmergencyComplete = async (points: number) => {
    if (!state.session) return;
    
    const updates = updateGamification(state.user, 'FOCUS_SESSION'); // Reuse focus session for points
    const timeSpent = 180; // Emergency session is roughly 3 mins
    
    const finalUpdates = {
      ...updates,
      focus_time_total: (state.user.focusTimeTotal || 0) + timeSpent,
      focus_time_today: (state.user.focusTimeToday || 0) + timeSpent,
      sabr_points: (state.user.sabrPoints || 0) + points,
      sabr_points_today: (state.user.sabrPointsToday || 0) + points,
      total_wins: (state.user.totalWins || 0) + 1
    };

    syncProfile(finalUpdates as any);
    updateUserState(finalUpdates);
    
    addNotification({
      type: 'achievement',
      title: 'Emergency Focus Complete',
      content: `Well done! Ritual finished. +${points} Sabr points.`,
      icon: '💎'
    });
    
    handleViewChange('home');
  };

  const handleSelectResource = (resource: Resource) => {
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        selectedResource: resource
      }
    }));
  };

  const handleToggleSaveResource = async (resourceId: string) => {
    if (!state.user.id) return;
    try {
      const isSaved = state.user.savedResources?.includes(resourceId);
      const newSaved = isSaved 
        ? state.user.savedResources.filter(id => id !== resourceId)
        : [...(state.user.savedResources || []), resourceId];
      
      const profileId = state.user.id || state.session?.uid;
      if (!profileId) throw new Error('No user profile ID found');

      await updateDoc(doc(db, 'profiles', profileId), {
        savedResources: newSaved
      });

      setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          savedResources: newSaved
        }
      }));

      addNotification({
        type: 'achievement',
        title: isSaved ? 'Removed from Saved' : 'Saved for Later',
        content: isSaved ? 'Resource removed from your library.' : 'Resource added to your library.',
        icon: isSaved ? '🗑️' : '🔖'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'profiles');
    }
  };

  const handleBackFromReader = () => {
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        selectedResource: undefined
      }
    }));
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!state.session) return;
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + challenge.durationDays);

    const newUserChallenge: Partial<UserChallenge> = {
      user_id: state.session.uid,
      challengeId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      currentDay: 1,
      dailyProgress: {},
      streak: 0
    };

    try {
      await addDoc(collection(db, 'user_challenges'), newUserChallenge);
      addNotification({
        type: 'achievement',
        title: 'Challenge Accepted!',
        content: `You've started the ${challenge.title}. Stay disciplined!`,
        icon: '🛡️'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'user_challenges');
    }
  };

  const handleCheckInChallenge = async (userChallengeId: string, taskId: string) => {
    if (!state.session) return;
    const userChallenge = state.user.userChallenges.find(uc => uc.id === userChallengeId);
    if (!userChallenge) return;

    const challenge = challenges.find(c => c.id === userChallenge.challengeId);
    if (!challenge) return;

    const today = new Date().toLocaleDateString();
    const currentProgress = userChallenge.dailyProgress[today] || { completedTasks: [], percentage: 0 };
    
    const isCheckingIn = !currentProgress.completedTasks.includes(taskId);
    const newCompletedTasks = isCheckingIn
      ? [...currentProgress.completedTasks, taskId]
      : currentProgress.completedTasks.filter(id => id !== taskId);
    
    const newPercentage = (newCompletedTasks.length / challenge.tasks.length) * 100;

    const updatedProgress = {
      ...userChallenge.dailyProgress,
      [today]: {
        completedTasks: newCompletedTasks,
        percentage: newPercentage
      }
    };

    try {
      await updateDoc(doc(db, 'user_challenges', userChallengeId), {
        dailyProgress: updatedProgress,
        streak: (newPercentage === 100 && isCheckingIn) ? userChallenge.streak + 1 : userChallenge.streak,
        lastCheckInDate: new Date().toISOString()
      });

      if (newPercentage === 100 && isCheckingIn) {
        handleGamificationUpdate('TASK_COMPLETE'); // Reward for finishing daily roadmap
        const totalWins = (state.user.totalWins || 0) + 1;
        syncProfile({ totalWins } as any);
        setState(prev => ({ 
          ...prev, 
          user: { ...prev.user, totalWins } 
        }));
        addNotification({
          type: 'achievement',
          title: 'Roadmap Complete!',
          content: 'You finished all tasks for today. Keep it up!',
          icon: '🔥'
        });
      }

      if (isCheckingIn) {
        handleGamificationUpdate('CHALLENGE_CHECKIN');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'user_challenges');
      // Revert optimistic update on error? For now, let's keep it simple.
    }
  };

  const handleLeaveChallenge = async (userChallengeId: string) => {
    if (!state.session) return;
    try {
      await deleteDoc(doc(db, 'user_challenges', userChallengeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'user_challenges');
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!state.session) return;
    try {
      await deleteDoc(doc(db, 'challenges', challengeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'challenges');
    }
  };

  const handleCreateChallenge = async (challengeData: Partial<Challenge>) => {
    if (!state.session) return;
    
    const newChallenge = {
      ...challengeData,
      createdBy: state.session.uid,
      participantsCount: 1,
      published: false,
      terms: challengeData.terms || []
    };

    try {
      const docRef = await addDoc(collection(db, 'challenges'), newChallenge);
      handleJoinChallenge(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'challenges');
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.session) return;
    
    try {
      const profileRef = doc(db, 'profiles', state.session.uid);
      const firestoreUpdates: any = {};
      
      if (updates.name) firestoreUpdates.name = updates.name;
      if (updates.gender) firestoreUpdates.gender = updates.gender;
      if (updates.avatarUrl) firestoreUpdates.avatar_url = updates.avatarUrl;
      
      await updateDoc(profileRef, {
        ...firestoreUpdates,
        updated_at: serverTimestamp()
      });
      
      addNotification({
        type: 'achievement',
        title: 'Profile Updated',
        content: 'Your identity settings have been saved.',
        icon: '👤'
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, 'profiles');
    }
  };

  const handleSendEncouragement = async (targetUserId: string, challengeTitle: string) => {
    if (!state.session) return;
    
    // 1. One clap per day per person
    const today = new Date().toISOString().split('T')[0];
    const clapKey = `clap_${state.session.uid}_${targetUserId}_${today}`;
    
    if (localStorage.getItem(clapKey)) {
      addNotification({
        type: 'encouragement',
        title: 'Daily Limit Reached',
        content: 'You can only clap for this user once a day. Keep it valuable!',
        icon: '⏳'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        user_id: targetUserId,
        type: 'encouragement',
        title: 'New Clap Received! 👏',
        content: `${state.user.name} applauded your progress in "${challengeTitle}"!`,
        icon: '👏',
        read: false,
        created_at: serverTimestamp()
      });

      // Increment encouragementsReceived for the target user
      const targetProfileRef = doc(db, 'profiles', targetUserId);
      const targetProfileSnap = await getDoc(targetProfileRef);
      if (targetProfileSnap.exists()) {
        const currentData = targetProfileSnap.data();
        await updateDoc(targetProfileRef, {
          encouragements_received: (currentData.encouragements_received || 0) + 1
        });
      }

      localStorage.setItem(clapKey, 'true');

      addNotification({
        type: 'achievement',
        title: 'Applauded Partner',
        content: `You sent a clap to your partner. Support is everything!`,
        icon: '👏'
      });
      handleGamificationUpdate('COMMUNITY_INTERACTION'); // Small reward for supporting others
    } catch (error) {
      console.error('Error sending encouragement:', error);
    }
  };

  const renderView = () => {
    switch (state.view) {
      case 'home':
        return (
          <HomeView 
            userName={state.user.name}
            gender={state.user.gender}
            level={state.user.level}
            tasks={state.user.tasks}
            userChallenges={state.user.userChallenges}
            onToggleTask={handleToggleTask}
            onStartFocus={handleStartFocus}
            onDeleteTask={handleDeleteTask}
            onReorderTasks={handleReorderTasks}
            onAddTask={() => setIsAddTaskOpen(true)}
            totalPoints={state.user.points}
            totalWords={state.user.totalWordCount}
            totalWins={state.user.totalWins}
            onSelectMood={handleSelectMood}
            onViewChange={handleViewChange}
            growthScore={state.user.growthScore}
            streak={state.user.streak}
          />
        );
      case 'journal':
        return (
          <motion.div key="journal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <JournalView 
              entries={state.user.journalEntries} 
              moodLogs={state.user.moodLogs}
              onAddEntry={handleAddJournal} 
              onUpdateEntry={handleUpdateJournal}
              onBack={() => handleViewChange('home')}
              onWritingModeChange={setIsJournalWriting}
            />
          </motion.div>
        );
      case 'therapy':
        return (
          <TherapyView 
            user={state.user}
            onBack={() => handleViewChange('home')} 
            onBookTherapist={handleBookTherapist}
            initialTab={state.viewParams?.tab}
          />
        );
      case 'profile':
        return (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfileView 
              name={state.user.name} 
              level={state.user.level}
              experience={state.user.experience}
              nextLevelExp={state.user.nextLevelExp}
              streak={state.user.streak} 
              points={state.user.points} 
              badges={state.user.badges} 
              milestones={state.user.milestones}
              tasks={state.user.tasks}
              bookings={state.user.bookings}
              unlockedFeatures={state.user.unlockedFeatures}
              userAchievements={state.user.achievements}
              encouragementsReceived={state.user.encouragementsReceived}
              totalWordCount={state.user.totalWordCount}
              totalWins={state.user.totalWins}
              gender={state.user.gender}
              isAdmin={state.session?.email === 'qaalidibrahim.996@gmail.com'}
              onAdminClick={() => handleViewChange('admin')}
              onUpdateProfile={handleUpdateProfile}
              onBack={() => handleViewChange('home')}
              onLogout={handleLogout}
            />
          </motion.div>
        );
      case 'admin':
        return (
          <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminDashboard onBack={() => handleViewChange('profile')} />
          </motion.div>
        );
      case 'nasasho':
        return (
          <motion.div key="nasasho" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <NasashoView onBack={() => handleViewChange('home')} />
          </motion.div>
        );
      case 'challenges':
        return (
          <motion.div key="challenges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ChallengesView 
              challenges={challenges}
              userChallenges={state.user.userChallenges}
              userAchievements={state.user.achievements}
              sabrPoints={state.user.sabrPoints}
              points={state.user.points}
              isAdmin={state.session?.email === 'qaalidibrahim.996@gmail.com'}
              onJoinChallenge={handleJoinChallenge}
              onLeaveChallenge={handleLeaveChallenge}
              onCheckIn={handleCheckInChallenge}
              onCreateChallenge={handleCreateChallenge}
              onDeleteChallenge={handleDeleteChallenge}
              onSendEncouragement={handleSendEncouragement}
              onBack={() => handleViewChange('home')}
              initialChallengeId={initialChallengeId || undefined}
            />
          </motion.div>
        );
      case 'resources':
        return (
          <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {state.user.selectedResource ? (
              <ResourceReader 
                resource={state.user.selectedResource} 
                onBack={handleBackFromReader} 
                onComplete={handleReadResource}
                theme={state.theme}
                onThemeChange={handleThemeChange}
              />
            ) : (
              <ResourceView 
                onSelectResource={handleSelectResource} 
                onBack={() => handleViewChange('home')}
                savedResources={state.user.savedResources || []}
                completedResources={state.user.completedResources || []}
                onToggleSave={handleToggleSaveResource}
              />
            )}
          </motion.div>
        );
      case 'emergency':
        return (
          <EmergencyMode 
            onComplete={handleEmergencyComplete}
            onExit={() => handleViewChange('home')}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={48} />
      </div>
    );
  }

  if (!state.session) {
    return <Auth onAuthSuccess={(user) => setState(prev => ({ ...prev, session: user }))} />;
  }

  return (
    <div className="h-screen max-w-md mx-auto bg-bg text-text relative overflow-hidden flex flex-col antialiased transition-colors duration-500">
      {state.view !== 'emergency' && !state.user.selectedResource && (
        <Header 
          theme={state.theme} 
          onThemeChange={handleThemeChange} 
          notifications={state.notifications}
          onMarkRead={handleMarkNotificationRead}
          onClearAll={handleClearNotifications}
          activeView={state.view}
          onViewChange={handleViewChange}
        />
      )}
      
      <AnimatePresence>
        {shouldShowMoodPopup() && (
          <MoodCheckInOverlay onSelectMood={handleSelectMood} />
        )}
        {focusingTaskId && (
          <FocusTimer 
            taskTitle={state.user.tasks.find(t => t.id === focusingTaskId)?.title || ''}
            onComplete={handleFocusComplete}
            onCancel={() => setFocusingTaskId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div 
          key={state.view} 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="flex-1 overflow-y-auto custom-scrollbar pb-24"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {unlockedAchievement && (
          <AchievementUnlockOverlay 
            achievement={unlockedAchievement} 
            onClose={() => setUnlockedAchievement(null)} 
          />
        )}
      </AnimatePresence>

      {state.view !== 'therapy' && state.view !== 'admin' && !state.user.selectedResource && !isJournalWriting && (
        <BottomNav 
          activeView={state.view} 
          onViewChange={handleViewChange} 
        />
      )}

      <AnimatePresence>
        {isAddTaskOpen && (
          <AddTaskModal 
            onClose={() => setIsAddTaskOpen(false)} 
            onAdd={handleAddTask} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
