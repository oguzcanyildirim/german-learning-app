import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentService } from '../services/content.service';
import { Lesson } from '../models/lesson.model';

@Component({
  selector: 'app-lesson-detail',
  templateUrl: 'lesson-detail.page.html',
  styleUrls: ['lesson-detail.page.scss'],
  standalone: false,
})
export class LessonDetailPage implements OnInit {
  lesson: Lesson | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Make sure content is loaded before trying to find the lesson
      this.contentService.loadContent().subscribe(() => {
        this.lesson = this.contentService.getLessonById(id);
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/tabs/roadmap']);
  }
}
