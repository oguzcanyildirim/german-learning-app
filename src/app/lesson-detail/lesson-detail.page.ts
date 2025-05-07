import { Component, OnInit, SecurityContext } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import { marked } from 'marked';
import { ContentService } from '../services/content.service';
import { ProgressService } from '../services/progress.service';
import { Lesson, Phase } from '../models/lesson.model';
import { QuizResult } from '../models/quiz.model';

@Component({
  selector: 'app-lesson-detail',
  templateUrl: 'lesson-detail.page.html',
  styleUrls: ['lesson-detail.page.scss'],
  standalone: false,
})
export class LessonDetailPage implements OnInit {
  lesson: Lesson | undefined;
  phase: Phase | undefined;
  renderedContent: SafeHtml = '';
  showKeyTerms = false;
  showLlmPrompts = false;
  showQuiz = false;
  nextLesson: Lesson | undefined;
  previousLesson: Lesson | undefined;
  isCompleted = false;
  lastQuizResult: QuizResult | null = null;

  // Track time spent on this lesson
  private startTime = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private toastController: ToastController,
    private contentService: ContentService,
    private progressService: ProgressService
  ) {}

  ngOnInit(): void {
    this.startTime = Date.now();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.contentService.loadContent().subscribe(() => {
        this.lesson = this.contentService.getLessonById(id);
        if (this.lesson) {
          this.phase = this.contentService.getPhaseById(this.lesson.phaseId);
          this.renderContent();
          this.nextLesson = this.contentService.getNextLesson(id);
          this.previousLesson = this.contentService.getPreviousLesson(id);
          this.isCompleted = this.progressService.isLessonCompleted(id);
        }
      });
    }
  }

  // Convert markdown content to sanitized HTML
  private renderContent(): void {
    if (!this.lesson?.content) return;
    const rawHtml = marked.parse(this.lesson.content) as string;
    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  toggleKeyTerms(): void {
    this.showKeyTerms = !this.showKeyTerms;
  }

  toggleLlmPrompts(): void {
    this.showLlmPrompts = !this.showLlmPrompts;
  }

  toggleQuiz(): void {
    this.showQuiz = !this.showQuiz;
  }

  onQuizCompleted(result: QuizResult): void {
    this.lastQuizResult = result;
    this.progressService.saveQuizResult(result);
  }

  async copyPrompt(promptText: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(promptText);
      const toast = await this.toastController.create({
        message: 'Prompt kopyalandi!',
        duration: 1500,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();
    } catch {
      // Fallback if clipboard API is not available
      const toast = await this.toastController.create({
        message: 'Kopyalama basarisiz oldu',
        duration: 1500,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    }
  }

  async markComplete(): Promise<void> {
    if (!this.lesson) return;

    const minutesSpent = Math.max(1, Math.round((Date.now() - this.startTime) / 60000));
    await this.progressService.addStudyTime(this.lesson.id, minutesSpent);
    await this.progressService.completeLesson(this.lesson.id);
    this.isCompleted = true;

    const toast = await this.toastController.create({
      message: 'Ders tamamlandi!',
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }

  navigateToLesson(lessonId: string): void {
    // Save study time before navigating away
    if (this.lesson) {
      const minutesSpent = Math.max(1, Math.round((Date.now() - this.startTime) / 60000));
      this.progressService.addStudyTime(this.lesson.id, minutesSpent);
    }
    this.router.navigate(['/lesson', lessonId]);
  }

  goBack(): void {
    if (this.lesson) {
      const minutesSpent = Math.max(1, Math.round((Date.now() - this.startTime) / 60000));
      this.progressService.addStudyTime(this.lesson.id, minutesSpent);
    }
    this.router.navigate(['/tabs/roadmap']);
  }
}
