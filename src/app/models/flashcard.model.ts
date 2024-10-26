// Flashcard model with sm2 spaced repetition fields.
// The sm2 algorithm adjusts review intervals based on user performance.

export interface Flashcard {
  id: string;
  lessonId: string;
  front: string;          // question side (German)
  back: string;           // answer side (Turkish + explanation)
  difficulty: 'easy' | 'medium' | 'hard';

  // sm2 algorithm fields
  repetitions: number;    // number of times reviewed correctly in a row
  easeFactor: number;     // starts at 2.5, adjusts based on rating
  interval: number;       // days until next review
  nextReview: string;     // ISO date string for next scheduled review
}

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

// sm2 rating maps to quality scores (0-5 scale)
export const RATING_QUALITY: Record<FlashcardRating, number> = {
  'again': 0,
  'hard': 2,
  'good': 4,
  'easy': 5,
};
