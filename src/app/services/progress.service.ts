import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import {
  UserProgress,
  LessonProgress,
  DailyStats,
  DEFAULT_PROGRESS,
} from '../models/progress.model';

// Manages user progress data with local persistence via Capacitor Preferences.
// Tracks lesson completion, quiz scores, study streaks, and daily stats.

const PROGRESS_KEY = 'german_learning_progress';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private progress: UserProgress = { ...DEFAULT_PROGRESS };
  private progressSubject = new BehaviorSubject<UserProgress>(this.progress);

  progress$ = this.progressSubject.asObservable();

  constructor() {
    this.loadProgress();
  }

  private async loadProgress(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: PROGRESS_KEY });
      if (value) {
        this.progress = JSON.parse(value);
        this.progressSubject.next(this.progress);
      }
    } catch (e) {
      console.warn('Could not load progress, starting fresh:', e);
    }
  }

  private async saveProgress(): Promise<void> {
    await Preferences.set({
      key: PROGRESS_KEY,
      value: JSON.stringify(this.progress),
    });
    this.progressSubject.next(this.progress);
  }

  // Mark a lesson as completed and update streak
  async completeLesson(lessonId: string, quizScore?: number): Promise<void> {
    const now = new Date();
    const today = this.formatDate(now);

    const existing = this.progress.lessonProgress[lessonId];
    this.progress.lessonProgress[lessonId] = {
      lessonId,
      completed: true,
      completedAt: now.toISOString(),
      quizScore: quizScore !== undefined
        ? Math.max(quizScore, existing?.quizScore ?? 0)
        : existing?.quizScore,
      timeSpentMinutes: (existing?.timeSpentMinutes ?? 0),
      lastAccessedAt: now.toISOString(),
    };

    this.updateStreak(today);
    this.updateDailyStats(today, { lessonsCompleted: 1 });
    await this.saveProgress();
  }

  // Record quiz attempt for a lesson
  async recordQuiz(lessonId: string, score: number): Promise<void> {
    const today = this.formatDate(new Date());
    const existing = this.progress.lessonProgress[lessonId];

    if (existing) {
      existing.quizScore = Math.max(score, existing.quizScore ?? 0);
    }

    this.updateDailyStats(today, { quizzesTaken: 1 });
    await this.saveProgress();
  }

  // Add study time for a lesson
  async addStudyTime(lessonId: string, minutes: number): Promise<void> {
    const today = this.formatDate(new Date());
    const existing = this.progress.lessonProgress[lessonId] ?? {
      lessonId,
      completed: false,
      timeSpentMinutes: 0,
      lastAccessedAt: new Date().toISOString(),
    };

    existing.timeSpentMinutes += minutes;
    existing.lastAccessedAt = new Date().toISOString();
    this.progress.lessonProgress[lessonId] = existing;
    this.progress.totalMinutesStudied += minutes;

    this.updateDailyStats(today, { minutesStudied: minutes });
    await this.saveProgress();
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.progress.lessonProgress[lessonId]?.completed ?? false;
  }

  getLessonProgress(lessonId: string): LessonProgress | undefined {
    return this.progress.lessonProgress[lessonId];
  }

  getQuizScore(lessonId: string): number | undefined {
    return this.progress.lessonProgress[lessonId]?.quizScore;
  }

  // Count how many lessons are completed within a given phase
  getPhaseCompletionCount(lessonIds: string[]): number {
    return lessonIds.filter(id => this.isLessonCompleted(id)).length;
  }

  getOverallCompletionPercentage(totalLessons: number): number {
    const completed = Object.values(this.progress.lessonProgress)
      .filter(p => p.completed).length;
    return totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
  }

  getCurrentStreak(): number {
    return this.progress.currentStreak;
  }

  getLongestStreak(): number {
    return this.progress.longestStreak;
  }

  getTotalStudyMinutes(): number {
    return this.progress.totalMinutesStudied;
  }

  getDailyStats(): Record<string, DailyStats> {
    return this.progress.dailyStats;
  }

  // Streak logic: check if the user studied yesterday to keep the streak alive
  private updateStreak(today: string): void {
    if (this.progress.lastStudyDate === today) {
      return; // already counted today
    }

    const yesterday = this.formatDate(
      new Date(new Date(today).getTime() - 86400000)
    );

    if (this.progress.lastStudyDate === yesterday) {
      this.progress.currentStreak += 1;
    } else if (this.progress.lastStudyDate !== today) {
      this.progress.currentStreak = 1;
    }

    this.progress.longestStreak = Math.max(
      this.progress.longestStreak,
      this.progress.currentStreak
    );
    this.progress.lastStudyDate = today;
  }

  private updateDailyStats(
    date: string,
    update: Partial<Omit<DailyStats, 'date'>>
  ): void {
    const existing = this.progress.dailyStats[date] ?? {
      date,
      lessonsCompleted: 0,
      quizzesTaken: 0,
      flashcardsReviewed: 0,
      minutesStudied: 0,
    };

    if (update.lessonsCompleted) existing.lessonsCompleted += update.lessonsCompleted;
    if (update.quizzesTaken) existing.quizzesTaken += update.quizzesTaken;
    if (update.flashcardsReviewed) existing.flashcardsReviewed += update.flashcardsReviewed;
    if (update.minutesStudied) existing.minutesStudied += update.minutesStudied;

    this.progress.dailyStats[date] = existing;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
