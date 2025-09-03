import { Component, OnInit } from '@angular/core';
import { ContentService } from '../services/content.service';
import { ToastController } from '@ionic/angular';

interface LlmPromptItem {
  lessonTitle: string;
  phaseLevel: string;
  title: string;
  prompt: string;
}

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: false,
})
export class Tab4Page implements OnInit {
  activeSection: 'about' | 'llm' = 'about';
  allPrompts: LlmPromptItem[] = [];
  filteredPrompts: LlmPromptItem[] = [];
  selectedLevel = 'all';
  isLoading = true;

  // App statistics for about page
  totalLessons = 0;
  totalLevels = 6;

  constructor(
    private contentService: ContentService,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.contentService.loadContent().subscribe(phases => {
      this.totalLessons = this.contentService.getTotalLessonCount();

      // Collect all LLM prompts from all lessons
      for (const phase of phases) {
        for (const lesson of phase.lessons) {
          for (const prompt of lesson.llmPrompts) {
            this.allPrompts.push({
              lessonTitle: lesson.title,
              phaseLevel: phase.level,
              title: prompt.title,
              prompt: prompt.prompt,
            });
          }
        }
      }
      this.filteredPrompts = this.allPrompts;
      this.isLoading = false;
    });
  }

  filterPrompts(): void {
    if (this.selectedLevel === 'all') {
      this.filteredPrompts = this.allPrompts;
    } else {
      this.filteredPrompts = this.allPrompts.filter(
        p => p.phaseLevel === this.selectedLevel
      );
    }
  }

  async copyPrompt(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      const toast = await this.toastController.create({
        message: 'Prompt kopyalandi!',
        duration: 1500,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();
    } catch {
      const toast = await this.toastController.create({
        message: 'Kopyalama basarisiz',
        duration: 1500,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    }
  }
}
