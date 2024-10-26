import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
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
});
