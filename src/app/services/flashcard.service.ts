import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import {
  Flashcard,
  FlashcardRating,
  RATING_QUALITY,
} from '../models/flashcard.model';

// Manages flashcard deck and implements the sm2 spaced repetition algorithm.
// Review state is persisted locally so users keep their study progress.

const FLASHCARD_STATE_KEY = 'german_flashcard_state';

@Injectable({
  providedIn: 'root'
})
export class FlashcardService {
  private flashcards: Flashcard[] = [];
  private loaded = false;

  constructor(private http: HttpClient) {}

  loadFlashcards(): Observable<Flashcard[]> {
    if (this.loaded) {
      return of(this.flashcards);
    }

    return this.http.get<Flashcard[]>('assets/content/flashcards.json').pipe(
      tap(async cards => {
        // Merge saved review state with bundled card data
        const savedState = await this.loadSavedState();
        this.flashcards = cards.map(card => {
          const saved = savedState[card.id];
          return saved ? { ...card, ...saved } : card;
        });
        this.loaded = true;
      })
    );
  }

  // Get cards that are due for review (nextReview <= today)
  getDueCards(lessonId?: string): Flashcard[] {
    const today = new Date().toISOString().split('T')[0];
    return this.flashcards.filter(card => {
      const isDue = card.nextReview <= today;
      const matchesLesson = lessonId ? card.lessonId === lessonId : true;
      return isDue && matchesLesson;
    });
  }

  getCardsByLesson(lessonId: string): Flashcard[] {
    return this.flashcards.filter(c => c.lessonId === lessonId);
  }

  getCardsByPhase(phaseId: string): Flashcard[] {
    return this.flashcards.filter(c => c.lessonId.startsWith(phaseId));
  }

  // sm2 algorithm: recalculate interval and ease factor based on user rating
  async rateCard(cardId: string, rating: FlashcardRating): Promise<void> {
    const card = this.flashcards.find(c => c.id === cardId);
    if (!card) return;

    const quality = RATING_QUALITY[rating];

    if (quality < 3) {
      // Failed recall: reset repetitions but keep ease factor
      card.repetitions = 0;
      card.interval = 1;
    } else {
      // Successful recall: increase interval
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions += 1;
    }

    // Adjust ease factor (minimum 1.3)
    card.easeFactor = Math.max(
      1.3,
      card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    // Schedule next review
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + card.interval);
    card.nextReview = nextDate.toISOString().split('T')[0];

    await this.saveState();
  }

  getTotalCardCount(): number {
    return this.flashcards.length;
  }

  getDueCardCount(): number {
    return this.getDueCards().length;
  }

  // Persist only the sm2 state fields, not the full card content
  private async saveState(): Promise<void> {
    const state: Record<string, Partial<Flashcard>> = {};
    for (const card of this.flashcards) {
      state[card.id] = {
        repetitions: card.repetitions,
        easeFactor: card.easeFactor,
        interval: card.interval,
        nextReview: card.nextReview,
      };
    }
    await Preferences.set({
      key: FLASHCARD_STATE_KEY,
      value: JSON.stringify(state),
    });
  }

  private async loadSavedState(): Promise<Record<string, Partial<Flashcard>>> {
    try {
      const { value } = await Preferences.get({ key: FLASHCARD_STATE_KEY });
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  }
}
