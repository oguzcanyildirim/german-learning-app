import { Component, OnInit } from '@angular/core';
import { ProgressService } from '../services/progress.service';
import { ContentService } from '../services/content.service';
import { FlashcardService } from '../services/flashcard.service';
import { Phase } from '../models/lesson.model';
import { DailyStats } from '../models/progress.model';

interface PhaseStats {
  phase: Phase;
  completed: number;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit {
  currentStreak = 0;
  longestStreak = 0;
  totalMinutes = 0;
  totalLessons = 0;
  completedLessons = 0;
  overallPercentage = 0;
  phaseStats: PhaseStats[] = [];
  recentDays: DailyStats[] = [];
  dueFlashcards = 0;
  isLoading = true;

  constructor(
    private progressService: ProgressService,
    private contentService: ContentService,
    private flashcardService: FlashcardService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ionViewWillEnter(): void {
    if (!this.isLoading) {
      this.loadStats();
    }
  }

  loadStats(): void {
    this.contentService.loadContent().subscribe(phases => {
      this.totalLessons = this.contentService.getTotalLessonCount();
      this.currentStreak = this.progressService.getCurrentStreak();
      this.longestStreak = this.progressService.getLongestStreak();
      this.totalMinutes = this.progressService.getTotalStudyMinutes();
      this.overallPercentage = this.progressService.getOverallCompletionPercentage(this.totalLessons);

      this.phaseStats = phases.map(phase => {
        const lessonIds = phase.lessons.map(l => l.id);
        const completed = this.progressService.getPhaseCompletionCount(lessonIds);
        return {
          phase,
          completed,
          total: phase.lessons.length,
          percentage: phase.lessons.length > 0
            ? Math.round((completed / phase.lessons.length) * 100)
            : 0,
        };
      });

      this.completedLessons = this.phaseStats.reduce((sum, ps) => sum + ps.completed, 0);

      // Load last 7 days of activity
      const dailyStats = this.progressService.getDailyStats();
      this.recentDays = this.getLast7Days(dailyStats);

      // Flashcard due count
      this.flashcardService.loadFlashcards().subscribe(() => {
        this.dueFlashcards = this.flashcardService.getDueCardCount();
        this.isLoading = false;
      });
    });
  }

  private getLast7Days(stats: Record<string, DailyStats>): DailyStats[] {
    const days: DailyStats[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push(stats[key] ?? {
        date: key,
        lessonsCompleted: 0,
        quizzesTaken: 0,
        flashcardsReviewed: 0,
        minutesStudied: 0,
      });
    }
    return days;
  }

  getDayLabel(dateStr: string): string {
    const days = ['Paz', 'Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt'];
    return days[new Date(dateStr).getDay()];
  }

  getActivityHeight(stats: DailyStats): number {
    const total = stats.minutesStudied + stats.lessonsCompleted * 5 + stats.quizzesTaken * 3;
    return Math.min(100, Math.max(4, total * 2));
  }

  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} sa ${mins} dk` : `${hours} sa`;
  }
}
