import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ContentService } from '../services/content.service';
import { ProgressService } from '../services/progress.service';
import { Phase } from '../models/lesson.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  phases: Phase[] = [];
  expandedPhaseId: string | null = null;
  overallProgress = 0;
  completedCount = 0;
  totalCount = 0;

  constructor(
    private contentService: ContentService,
    private progressService: ProgressService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.contentService.loadContent().subscribe(phases => {
      this.phases = phases;
      this.totalCount = this.contentService.getTotalLessonCount();
      this.updateProgress();
    });

    // Re-calculate progress whenever it changes (e.g. after completing a lesson)
    this.progressService.progress$.subscribe(() => {
      this.updateProgress();
    });
  }

  togglePhase(phaseId: string): void {
    this.expandedPhaseId = this.expandedPhaseId === phaseId ? null : phaseId;
  }

  isPhaseExpanded(phaseId: string): boolean {
    return this.expandedPhaseId === phaseId;
  }

  openLesson(lessonId: string): void {
    this.router.navigate(['/lesson', lessonId]);
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.progressService.isLessonCompleted(lessonId);
  }

  getQuizScore(lessonId: string): number | undefined {
    return this.progressService.getQuizScore(lessonId);
  }

  getPhaseProgress(phase: Phase): number {
    const lessonIds = phase.lessons.map(l => l.id);
    const completed = this.progressService.getPhaseCompletionCount(lessonIds);
    return phase.lessons.length > 0
      ? Math.round((completed / phase.lessons.length) * 100)
      : 0;
  }

  getPhaseCompletedCount(phase: Phase): number {
    const lessonIds = phase.lessons.map(l => l.id);
    return this.progressService.getPhaseCompletionCount(lessonIds);
  }

  private updateProgress(): void {
    this.completedCount = Object.keys(
      this.progressService['progress'].lessonProgress
    ).filter(id => this.progressService.isLessonCompleted(id)).length;
    this.overallProgress = this.totalCount > 0
      ? Math.round((this.completedCount / this.totalCount) * 100)
      : 0;
  }
}
