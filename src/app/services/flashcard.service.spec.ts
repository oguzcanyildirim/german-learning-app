import { FlashcardService } from './flashcard.service';
import { RATING_QUALITY } from '../models/flashcard.model';

describe('FlashcardService', () => {
  let service: FlashcardService;

  beforeEach(() => {
    service = new FlashcardService(null as any);
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
});
