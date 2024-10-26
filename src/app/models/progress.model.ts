// Progress tracking models for user study data.
// Persisted locally using Capacitor Preferences for offline support.

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;       // ISO date
  quizScore?: number;         // best quiz percentage
  timeSpentMinutes: number;
  lastAccessedAt: string;     // ISO date
}

export interface DailyStats {
  date: string;               // YYYY-MM-DD format
  lessonsCompleted: number;
  quizzesTaken: number;
  flashcardsReviewed: number;
  minutesStudied: number;
}

export interface UserProgress {
  lessonProgress: Record<string, LessonProgress>;
  dailyStats: Record<string, DailyStats>;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;      // YYYY-MM-DD
  totalMinutesStudied: number;
}

// Fresh progress state for new users
export const DEFAULT_PROGRESS: UserProgress = {
  lessonProgress: {},
  dailyStats: {},
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: '',
  totalMinutesStudied: 0,
};
