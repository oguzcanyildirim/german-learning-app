import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Phase, Lesson } from '../models/lesson.model';

// Loads and caches lesson content from per-level JSON files.
// Each CEFR level has its own file for cleaner content management.

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private phases: Phase[] = [];
  private phasesSubject = new BehaviorSubject<Phase[]>([]);
  private loaded = false;

  private readonly levelFiles = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

  constructor(private http: HttpClient) {}

  // Load all phases from separate per-level JSON files
  loadContent(): Observable<Phase[]> {
    if (this.loaded) {
      return of(this.phases);
    }

    const requests = this.levelFiles.map(level =>
      this.http.get<Phase>(`assets/content/${level}.json`)
    );

    return forkJoin(requests).pipe(
      tap(phases => {
        this.phases = phases;
        this.phasesSubject.next(phases);
        this.loaded = true;
      })
    );
  }

  getPhases(): Observable<Phase[]> {
    return this.phasesSubject.asObservable();
  }

  getPhaseById(phaseId: string): Phase | undefined {
    return this.phases.find(p => p.id === phaseId);
  }

  getLessonById(lessonId: string): Lesson | undefined {
    for (const phase of this.phases) {
      const lesson = phase.lessons.find(l => l.id === lessonId);
      if (lesson) return lesson;
    }
    return undefined;
  }

  // Find the next lesson in sequence across all phases
  getNextLesson(currentLessonId: string): Lesson | undefined {
    const allLessons = this.getAllLessons();
    const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      return allLessons[currentIndex + 1];
    }
    return undefined;
  }

  getPreviousLesson(currentLessonId: string): Lesson | undefined {
    const allLessons = this.getAllLessons();
    const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
    if (currentIndex > 0) {
      return allLessons[currentIndex - 1];
    }
    return undefined;
  }

  // Flatten all lessons across phases into a single ordered list
  getAllLessons(): Lesson[] {
    return this.phases.flatMap(phase => phase.lessons);
  }

  getTotalLessonCount(): number {
    return this.getAllLessons().length;
  }

  // Get lesson count per phase for progress display
  getLessonCountByPhase(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const phase of this.phases) {
      counts[phase.id] = phase.lessons.length;
    }
    return counts;
  }
}
