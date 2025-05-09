import { Component, OnInit } from '@angular/core';
import { FlashcardService } from '../services/flashcard.service';
import { ProgressService } from '../services/progress.service';
import { ContentService } from '../services/content.service';
import { Flashcard, FlashcardRating } from '../models/flashcard.model';
import { Phase } from '../models/lesson.model';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  dueCards: Flashcard[] = [];
  currentCard: Flashcard | null = null;
  currentIndex = 0;
  isFlipped = false;
  isLoading = true;
  sessionCompleted = false;

  // Filter options
  phases: Phase[] = [];
  selectedPhase = 'all';
  totalCards = 0;
  reviewedInSession = 0;

  constructor(
    private flashcardService: FlashcardService,
    private progressService: ProgressService,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    this.contentService.loadContent().subscribe(phases => {
      this.phases = phases;
      this.loadCards();
    });
  }

  // Reload cards when tab becomes visible again
  ionViewWillEnter(): void {
    if (!this.isLoading) {
      this.sessionCompleted = false;
      this.loadCards();
    }
  }

  loadCards(): void {
    this.flashcardService.loadFlashcards().subscribe(() => {
      this.filterCards();
      this.isLoading = false;
    });
  }

  filterCards(): void {
    if (this.selectedPhase === 'all') {
      this.dueCards = this.flashcardService.getDueCards();
    } else {
      this.dueCards = this.flashcardService.getDueCards().filter(
        c => c.lessonId.startsWith(this.selectedPhase)
      );
    }
    this.totalCards = this.dueCards.length;
    this.currentIndex = 0;
    this.reviewedInSession = 0;
    this.sessionCompleted = false;
    this.isFlipped = false;
    this.currentCard = this.dueCards.length > 0 ? this.dueCards[0] : null;
  }

  onFilterChange(): void {
    this.filterCards();
  }

  flipCard(): void {
    this.isFlipped = !this.isFlipped;
  }

  async rateCard(rating: FlashcardRating): Promise<void> {
    if (!this.currentCard) return;

    await this.flashcardService.rateCard(this.currentCard.id, rating);
    this.reviewedInSession++;

    // Move to next card
    this.currentIndex++;
    this.isFlipped = false;

    if (this.currentIndex < this.dueCards.length) {
      this.currentCard = this.dueCards[this.currentIndex];
    } else {
      this.currentCard = null;
      this.sessionCompleted = true;
    }
  }

  get remainingCards(): number {
    return Math.max(0, this.dueCards.length - this.currentIndex);
  }

  get progressPercent(): number {
    if (this.totalCards === 0) return 0;
    return Math.round((this.reviewedInSession / this.totalCards) * 100);
  }

  restartSession(): void {
    this.filterCards();
  }

  // Determine which phase a card belongs to for display
  getCardPhase(card: Flashcard): string {
    const parts = card.lessonId.split('-');
    return parts[0].toUpperCase();
  }
}
