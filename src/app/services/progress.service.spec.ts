import { ProgressService } from './progress.service';
import { Preferences } from '@capacitor/preferences';

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
    spyOn(Preferences, 'get').and.returnValue(Promise.resolve({ value: null }));
    spyOn(Preferences, 'set').and.returnValue(Promise.resolve());
    service = new ProgressService();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should start with zero streak', () => {
    expect(service.getCurrentStreak()).toBe(0);
    expect(service.getLongestStreak()).toBe(0);
  });

  it('should start with zero study minutes', () => {
    expect(service.getTotalStudyMinutes()).toBe(0);
  });

  it('should report lesson as not completed initially', () => {
    expect(service.isLessonCompleted('a1-01')).toBeFalse();
  });

  it('should return undefined quiz score for unstarted lesson', () => {
    expect(service.getQuizScore('a1-01')).toBeUndefined();
  });

  it('should count phase completion correctly', () => {
    const count = service.getPhaseCompletionCount(['a1-01', 'a1-02', 'a1-03']);
    expect(count).toBe(0);
  });

  it('should return 0% overall when no lessons completed', () => {
    expect(service.getOverallCompletionPercentage(30)).toBe(0);
  });

  it('should return 0% when total lessons is 0', () => {
    expect(service.getOverallCompletionPercentage(0)).toBe(0);
  });

  describe('completeLesson', () => {
    it('should mark lesson as completed', async () => {
      await service.completeLesson('a1-01');
      expect(service.isLessonCompleted('a1-01')).toBeTrue();
    });

    it('should increment completed lesson count', async () => {
      await service.completeLesson('a1-01');
      await service.completeLesson('a1-02');
      expect(service.getCompletedLessonCount()).toBe(2);
    });

    it('should keep best quiz score on re-completion', async () => {
      await service.completeLesson('a1-01', 85);
      await service.completeLesson('a1-01', 60);
      expect(service.getQuizScore('a1-01')).toBe(85);
    });

    it('should update to higher quiz score', async () => {
      await service.completeLesson('a1-01', 60);
      await service.completeLesson('a1-01', 95);
      expect(service.getQuizScore('a1-01')).toBe(95);
    });

    it('should persist progress after completion', async () => {
      await service.completeLesson('a1-01');
      expect(Preferences.set).toHaveBeenCalled();
    });

    it('should calculate overall completion percentage', async () => {
      await service.completeLesson('a1-01');
      await service.completeLesson('a1-02');
      expect(service.getOverallCompletionPercentage(10)).toBe(20);
    });
  });

  describe('streak tracking', () => {
    it('should start streak at 1 on first lesson', async () => {
      await service.completeLesson('a1-01');
      expect(service.getCurrentStreak()).toBe(1);
    });

    it('should not double-count same day', async () => {
      await service.completeLesson('a1-01');
      await service.completeLesson('a1-02');
      expect(service.getCurrentStreak()).toBe(1);
    });

    it('should update longest streak', async () => {
      await service.completeLesson('a1-01');
      expect(service.getLongestStreak()).toBe(1);
    });
  });

  describe('study time', () => {
    it('should accumulate study time', async () => {
      await service.addStudyTime('a1-01', 10);
      await service.addStudyTime('a1-01', 5);
      expect(service.getTotalStudyMinutes()).toBe(15);
    });

    it('should track study time per lesson', async () => {
      await service.addStudyTime('a1-01', 10);
      const progress = service.getLessonProgress('a1-01');
      expect(progress).toBeDefined();
      expect(progress!.timeSpentMinutes).toBe(10);
    });

    it('should create lesson progress entry if none exists', async () => {
      expect(service.getLessonProgress('a1-03')).toBeUndefined();
      await service.addStudyTime('a1-03', 5);
      expect(service.getLessonProgress('a1-03')).toBeDefined();
      expect(service.getLessonProgress('a1-03')!.completed).toBeFalse();
    });
  });

  describe('quiz recording', () => {
    it('should update quiz score for existing lesson', async () => {
      await service.completeLesson('a1-01');
      await service.recordQuiz('a1-01', 75);
      expect(service.getQuizScore('a1-01')).toBe(75);
    });

    it('should keep best quiz score', async () => {
      await service.completeLesson('a1-01', 90);
      await service.recordQuiz('a1-01', 70);
      expect(service.getQuizScore('a1-01')).toBe(90);
    });
  });

  describe('phase completion', () => {
    it('should count completed lessons in phase', async () => {
      await service.completeLesson('a1-01');
      await service.completeLesson('a1-03');
      const count = service.getPhaseCompletionCount(['a1-01', 'a1-02', 'a1-03']);
      expect(count).toBe(2);
    });
  });

  describe('daily stats', () => {
    it('should record lesson completion in daily stats', async () => {
      await service.completeLesson('a1-01');
      const stats = service.getDailyStats();
      const today = new Date().toISOString().split('T')[0];
      expect(stats[today]).toBeDefined();
      expect(stats[today].lessonsCompleted).toBe(1);
    });

    it('should accumulate daily stats across multiple actions', async () => {
      await service.completeLesson('a1-01');
      await service.completeLesson('a1-02');
      const stats = service.getDailyStats();
      const today = new Date().toISOString().split('T')[0];
      expect(stats[today].lessonsCompleted).toBe(2);
    });

    it('should track study minutes in daily stats', async () => {
      await service.addStudyTime('a1-01', 20);
      const stats = service.getDailyStats();
      const today = new Date().toISOString().split('T')[0];
      expect(stats[today].minutesStudied).toBe(20);
    });
  });
});
