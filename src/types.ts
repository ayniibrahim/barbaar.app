export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  time: string;
  duration?: string;
  completed: boolean;
  completedAt?: string;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
  focusTimeSpent: number; // in seconds
}

export type Mood = 'very-sad' | 'sad' | 'neutral' | 'happy' | 'very-happy';

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood?: Mood;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export type ViewType = 'home' | 'journal' | 'therapy' | 'profile' | 'resources' | 'emergency' | 'nasasho' | 'admin' | 'challenges';

export type NasashoCategory = 'Podcast' | 'Quran' | 'Nature' | 'Sleep';

export interface NasashoContent {
  id: string;
  title: string;
  category: NasashoCategory;
  audioUrl?: string;
  embedUrl?: string;
  duration: string;
  image: string;
  description: string;
  reciter?: string;
  published?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  category: 'consistency' | 'mindset' | 'growth';
  progress?: number;
  maxProgress?: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetPoints: number;
  reward: string;
  achieved: boolean;
}

export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  image: string;
  rate: string;
  rating: number;
  availableSlots: string[];
  published?: boolean;
}

export interface Booking {
  id: string;
  therapistId: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export type ResourceType = 'Course' | 'Book Summary' | 'Article' | 'Audio Book' | 'Scientific Paper' | 'Podcast';

export type ResourceCategory = 'Wellness' | 'Growth' | 'Productivity' | 'Habits';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  category: ResourceCategory;
  image: string;
  duration: string;
  progress?: number;
  content?: string;
  pages?: string[];
  author?: string;
  language?: 'en' | 'so' | 'ar';
  audioUrl?: string;
  embedUrl?: string;
  published?: boolean;
}

export type ThemeType = 'light' | 'sepia' | 'dark';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'consistency' | 'mindset' | 'growth';
  requirement: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  level: number;
  experience: number;
  nextLevelExp: number;
  streak: number;
  journalStreak: number;
  points: number; // General XP/Points
  sabrPoints: number; // Points for good activities/patience
  growthScore: number; // Holistic growth score (0-100)
  focusTimeTotal: number; // Total focus time in seconds
  focusTimeToday: number; // Focus time today in seconds
  dailyWins: number; // Count of daily wins
  sabrPointsToday: number; // Sabr points earned today
  mood?: Mood;
  hasCheckedIn: boolean;
  lastMoodLogDate?: string; // ISO date of last mood log
  moodLogCountToday: number; // Number of mood logs today
  lastActiveDate?: string;
  lastRewardDate?: string; // For variable rewards
  unlockedFeatures: string[]; // e.g., ['premium-content', 'custom-themes']
  achievements: string[]; // IDs of unlocked badges/achievements
  language: 'en' | 'so';
  gender?: 'male' | 'female' | 'other';
  completedResources: string[]; // IDs of completed resources
  savedResources: string[]; // IDs of saved resources
  encouragementsReceived?: number;
  totalWordCount: number;
  totalWins: number;
}

export interface MoodLog {
  id: string;
  userId: string;
  date: string; // ISO date
  mood: Mood;
  note?: string;
}

export interface AppNotification {
  id: string;
  type: 'achievement' | 'reminder' | 'encouragement';
  title: string;
  content: string;
  timestamp: string;
  read: boolean;
  icon?: string;
}

export interface ChallengeTask {
  id: string;
  title: string;
  description?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  tasks: ChallengeTask[];
  category: 'discipline' | 'health' | 'mindset' | 'productivity';
  image?: string;
  isCustom?: boolean;
  createdBy?: string;
  participantsCount: number;
  published?: boolean;
  terms?: string[];
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challengeId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'failed';
  currentDay: number;
  dailyProgress: {
    [date: string]: {
      completedTasks: string[];
      percentage: number;
    }
  };
  streak: number;
  lastCheckInDate?: string;
}

export interface ChatRoom {
  id: string;
  user_id: string;
  user_name: string;
  status: 'waiting' | 'active' | 'closed';
  created_at: any;
  last_message_at?: any;
  assigned_team_member_id?: string;
  assigned_team_member_name?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'user' | 'team';
  text: string;
  created_at: any;
}

// Firestore Document Interfaces
export interface FirestoreProfile {
  name?: string;
  avatar_url?: string;
  level?: number;
  experience?: number;
  next_level_exp?: number;
  streak?: number;
  journal_streak?: number;
  points?: number;
  sabr_points?: number;
  sabr_points_today?: number;
  growth_score?: number;
  focus_time_total?: number;
  focus_time_today?: number;
  daily_wins?: number;
  has_checked_in?: boolean;
  mood_log_count_today?: number;
  last_mood_log_date?: string;
  last_active_date?: string;
  last_reward_date?: string;
  unlocked_features?: string[];
  achievements?: string[];
  language?: 'en' | 'so';
  gender?: 'male' | 'female' | 'other';
  completed_resources?: string[];
  saved_resources?: string[];
  encouragements_received?: number;
  total_word_count?: number;
  total_wins?: number;
  updated_at?: any;
}

export interface FirestoreTask {
  user_id: string;
  title: string;
  time: string;
  priority: Priority;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  focus_time_spent?: number;
  created_at: any;
}

export interface FirestoreJournalEntry {
  user_id: string;
  date: string;
  content: string;
  mood?: Mood;
  created_at: any;
}

export interface FirestoreMoodLog {
  user_id: string;
  date: string;
  mood: Mood;
  created_at: any;
}

export interface AppState {
  view: ViewType;
  viewParams?: any;
  theme: ThemeType;
  session: any | null; // Firebase User
  notifications: AppNotification[];
  user: UserProfile & {
    tasks: Task[];
    journalEntries: JournalEntry[];
    moodLogs: MoodLog[];
    badges: Badge[];
    milestones: Milestone[];
    bookings: Booking[];
    userChallenges: UserChallenge[];
    selectedResource?: Resource;
  };
}
