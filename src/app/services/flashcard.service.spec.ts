import { FlashcardService } from './flashcard.service';
import { Flashcard, RATING_QUALITY } from '../models/flashcard.model';
import { Preferences } from '@capacitor/preferences';

function makeCard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: 'card-1',
    lessonId: 'a1-01',
    front: 'Hund',
    back: 'Kopek',
    difficulty: 'medium',
    repetitions: 0,
    easeFactor: 2.5,
    interval: 0,
    nextReview: '2020-01-01',
    ...overrides,
  };
}

describe('FlashcardService', () => {
  let service: FlashcardService;

  beforeEach(() => {
    service = new FlashcardService(null as any);
    spyOn(Preferences, 'set').and.returnValue(Promise.resolve());
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('sm2 rating quality mapping', () => {
    it('should map "again" to quality 0', () => {
      expect(RATING_QUALITY['again']).toBe(0);
    });

    it('should map "hard" to quality 2', () => {
      expect(RATING_QUALITY['hard']).toBe(2);
    });

    it('should map "good" to quality 4', () => {
      expect(RATING_QUALITY['good']).toBe(4);
    });

    it('should map "easy" to quality 5', () => {
      expect(RATING_QUALITY['easy']).toBe(5);
    });
  });

  it('should return 0 for total card count before loading', () => {
    expect(service.getTotalCardCount()).toBe(0);
  });

  it('should return 0 for due card count before loading', () => {
    expect(service.getDueCardCount()).toBe(0);
  });

  describe('rateCard / sm2 algorithm', () => {
    beforeEach(() => {
      const cards = [
        makeCard({ id: 'c1', lessonId: 'a1-01' }),
        makeCard({ id: 'c2', lessonId: 'a1-02', easeFactor: 2.5, repetitions: 2, interval: 6 }),
        makeCard({ id: 'c3', lessonId: 'b1-01' }),
      ];
      (service as any).flashcards = cards;
      (service as any).loaded = true;
    });

    it('should reset interval to 1 on "again" rating', async () => {
      const card = (service as any).flashcards[1]; // c2 has interval 6
      await service.rateCard('c2', 'again');
      expect(card.repetitions).toBe(0);
      expect(card.interval).toBe(1);
    });

    it('should set interval to 1 on first successful recall', async () => {
      await service.rateCard('c1', 'good');
      const card = (service as any).flashcards[0];
      expect(card.interval).toBe(1);
      expect(card.repetitions).toBe(1);
    });

    it('should set interval to 6 on second successful recall', async () => {
      await service.rateCard('c1', 'good');
      await service.rateCard('c1', 'good');
      const card = (service as any).flashcards[0];
      expect(card.interval).toBe(6);
      expect(card.repetitions).toBe(2);
    });

    it('should multiply interval by ease factor on third+ recall', async () => {
      const card = (service as any).flashcards[1]; // rep=2, interval=6, ef=2.5
      await service.rateCard('c2', 'good');
      expect(card.interval).toBe(Math.round(6 * 2.5));
      expect(card.repetitions).toBe(3);
    });

    it('should never let ease factor drop below 1.3', async () => {
      const card = (service as any).flashcards[0];
      card.easeFactor = 1.4;
      await service.rateCard('c1', 'hard');
      // quality=2, EF adjustment: 0.1 - 3*(0.08+3*0.02) = 0.1 - 0.42 = -0.32
      // 1.4 + (-0.32) = 1.08 but clamped to 1.3
      expect(card.easeFactor).toBe(1.3);
    });

    it('should increase ease factor on "easy" rating', async () => {
      const card = (service as any).flashcards[0];
      const before = card.easeFactor;
      await service.rateCard('c1', 'easy');
      expect(card.easeFactor).toBeGreaterThan(before);
    });

    it('should schedule next review in the future', async () => {
      await service.rateCard('c1', 'good');
      const card = (service as any).flashcards[0];
      const today = new Date().toISOString().split('T')[0];
      expect(card.nextReview >= today).toBeTrue();
    });

    it('should do nothing for unknown card id', async () => {
      await service.rateCard('nonexistent', 'good');
      // just verify it doesn't throw
      expect(service.getTotalCardCount()).toBe(3);
    });

    it('should persist state after rating', async () => {
      await service.rateCard('c1', 'good');
      expect(Preferences.set).toHaveBeenCalled();
    });
  });

  describe('getDueCards', () => {
    beforeEach(() => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      (service as any).flashcards = [
        makeCard({ id: 'due1', lessonId: 'a1-01', nextReview: '2020-01-01' }),
        makeCard({ id: 'due2', lessonId: 'a1-01', nextReview: today }),
        makeCard({ id: 'notdue', lessonId: 'a1-02', nextReview: tomorrow }),
      ];
      (service as any).loaded = true;
    });

    it('should return cards with past or today nextReview', () => {
      const due = service.getDueCards();
      expect(due.length).toBe(2);
      expect(due.map(c => c.id)).toEqual(['due1', 'due2']);
    });

    it('should filter by lessonId when provided', () => {
      const due = service.getDueCards('a1-01');
      expect(due.length).toBe(2);
    });

    it('should return empty for lesson with no due cards', () => {
      const due = service.getDueCards('b2-01');
      expect(due.length).toBe(0);
    });
  });

  describe('getCardsByLesson / getCardsByPhase', () => {
    beforeEach(() => {
      (service as any).flashcards = [
        makeCard({ id: 'x1', lessonId: 'a1-01' }),
        makeCard({ id: 'x2', lessonId: 'a1-02' }),
        makeCard({ id: 'x3', lessonId: 'b1-01' }),
      ];
    });

    it('should filter cards by exact lesson id', () => {
      expect(service.getCardsByLesson('a1-01').length).toBe(1);
      expect(service.getCardsByLesson('a1-02').length).toBe(1);
    });

    it('should filter cards by phase prefix', () => {
      expect(service.getCardsByPhase('a1').length).toBe(2);
      expect(service.getCardsByPhase('b1').length).toBe(1);
    });
  });
});
