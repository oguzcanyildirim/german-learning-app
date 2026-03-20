import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContentService } from './content.service';
import { Phase } from '../models/lesson.model';

const MOCK_PHASES: Phase[] = [
  {
    id: 'a1', title: 'A1 - Anfänger', subtitle: 'Beginner',
    level: 'A1', color: '#10b981', icon: 'leaf-outline',
    lessons: [
      {
        id: 'a1-01', phaseId: 'a1', title: 'Alphabet', subtitle: 'Letters',
        content: '# Alphabet', keyTerms: [], quiz: [], llmPrompts: [],
        estimatedMinutes: 15, order: 1,
      },
      {
        id: 'a1-02', phaseId: 'a1', title: 'Artikel', subtitle: 'Articles',
        content: '# Der Die Das', keyTerms: [], quiz: [], llmPrompts: [],
        estimatedMinutes: 20, order: 2,
      },
    ],
  },
  {
    id: 'a2', title: 'A2 - Grundlagen', subtitle: 'Elementary',
    level: 'A2', color: '#14b8a6', icon: 'book-outline',
    lessons: [
      {
        id: 'a2-01', phaseId: 'a2', title: 'Perfekt', subtitle: 'Past tense',
        content: '# Perfekt', keyTerms: [], quiz: [], llmPrompts: [],
        estimatedMinutes: 25, order: 1,
      },
    ],
  },
];

describe('ContentService', () => {
  let service: ContentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ContentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function loadTestContent(): void {
    service.loadContent().subscribe();
    for (const phase of MOCK_PHASES) {
      const req = httpMock.expectOne(`assets/content/${phase.id}.json`);
      req.flush(phase);
    }
    ['b1', 'b2', 'c1', 'c2'].forEach(level => {
      const req = httpMock.expectOne(`assets/content/${level}.json`);
      req.flush({ id: level, title: level.toUpperCase(), subtitle: '', level: level.toUpperCase(), color: '', icon: '', lessons: [] });
    });
  }

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should load content from all level files', () => {
    let loaded = false;
    service.loadContent().subscribe(phases => {
      expect(phases.length).toBe(6);
      loaded = true;
    });

    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach(level => {
      const req = httpMock.expectOne(`assets/content/${level}.json`);
      req.flush(MOCK_PHASES.find(p => p.id === level) ?? { id: level, title: '', subtitle: '', level, color: '', icon: '', lessons: [] });
    });

    expect(loaded).toBeTrue();
  });

  it('should return cached content on second call', () => {
    loadTestContent();

    let secondCallResult: Phase[] = [];
    service.loadContent().subscribe(phases => secondCallResult = phases);

    httpMock.expectNone('assets/content/a1.json');
    expect(secondCallResult.length).toBe(6);
  });

  it('should find phase by id', () => {
    loadTestContent();

    const phase = service.getPhaseById('a1');
    expect(phase).toBeDefined();
    expect(phase!.title).toBe('A1 - Anfänger');
  });

  it('should return undefined for unknown phase', () => {
    loadTestContent();
    expect(service.getPhaseById('z9')).toBeUndefined();
  });

  it('should find lesson by id across phases', () => {
    loadTestContent();

    const lesson = service.getLessonById('a2-01');
    expect(lesson).toBeDefined();
    expect(lesson!.title).toBe('Perfekt');
  });

  it('should return undefined for unknown lesson', () => {
    loadTestContent();
    expect(service.getLessonById('x9-99')).toBeUndefined();
  });

  it('should get next lesson within same phase', () => {
    loadTestContent();

    const next = service.getNextLesson('a1-01');
    expect(next).toBeDefined();
    expect(next!.id).toBe('a1-02');
  });

  it('should get next lesson across phases', () => {
    loadTestContent();

    const next = service.getNextLesson('a1-02');
    expect(next).toBeDefined();
    expect(next!.id).toBe('a2-01');
  });

  it('should return undefined for next when at last lesson', () => {
    loadTestContent();
    expect(service.getNextLesson('a2-01')).toBeUndefined();
  });

  it('should get previous lesson', () => {
    loadTestContent();

    const prev = service.getPreviousLesson('a1-02');
    expect(prev).toBeDefined();
    expect(prev!.id).toBe('a1-01');
  });

  it('should return undefined for previous when at first lesson', () => {
    loadTestContent();
    expect(service.getPreviousLesson('a1-01')).toBeUndefined();
  });

  it('should count total lessons across all phases', () => {
    loadTestContent();
    expect(service.getTotalLessonCount()).toBe(3);
  });

  it('should flatten all lessons in order', () => {
    loadTestContent();

    const all = service.getAllLessons();
    expect(all.map(l => l.id)).toEqual(['a1-01', 'a1-02', 'a2-01']);
  });
});
