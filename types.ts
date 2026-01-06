export enum ReadingStatus {
  READING = 'Reading',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold',
  DROPPED = 'Dropped',
  PLAN_TO_READ = 'Plan to Read',
}

export interface Manhwa {
  id: string; // UUID or Source ID
  title: string;
  cover_url: string;
  description: string;
  source_id?: string;
  created_at: string;
  lastChapter?: number; // Total chapters from manga metadata
}

export type ManhwaItem = Manhwa;

export interface UserProgress {
  id: string;
  manhwa_id: string;
  status: ReadingStatus;
  last_chapter: number;
  rating: number; // 0-10
  notes: string;
  updated_at: string;
}

export interface LibraryItem extends Manhwa {
  progress?: UserProgress;
}

export interface MangaDexResult {
  id: string;
  attributes: {
    title: { en?: string; ja?: string; [key: string]: string | undefined };
    description: { en?: string; [key: string]: string | undefined };
    createdAt: string;
  };
  relationships: {
    type: string;
    id: string;
    attributes?: {
      fileName?: string;
    };
  }[];
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface UserStats {
  totalManhwa: number;
  currentlyReading: number;
  completed: number;
  totalChapters: number;
  averageRating: number;
  completionRate: number;
  daysActive: number;
}

export type GoalType = 'monthly' | 'yearly' | 'custom';
export type TargetType = 'manhwa_count' | 'chapter_count' | 'completed_count';

export interface ReadingGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  target_type: TargetType;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  completed: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string;
  unlocked_at: string;
  icon: string;
}

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:mm format
  streakReminders: boolean;
  goalMilestones: boolean;
  continueReadingSuggestions: boolean;
}
