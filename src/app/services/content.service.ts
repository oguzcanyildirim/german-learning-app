import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Phase, Lesson } from '../models/lesson.model';

// Loads and caches lesson content from the bundled JSON files.
// All content is shipped with the app for offline access.

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private phases: Phase[] = [];
  private phasesSubject = new BehaviorSubject<Phase[]>([]);
  private loaded = false;

  constructor(private http: HttpClient) {}

  // Load all phases and lessons from the bundled JSON
  loadContent(): Observable<Phase[]> {
    if (this.loaded) {
      return of(this.phases);
    }

    return this.http.get<Phase[]>('assets/content/lessons.json').pipe(
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
