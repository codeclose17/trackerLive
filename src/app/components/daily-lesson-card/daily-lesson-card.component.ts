import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getDailyLesson } from '../../utils/daily-lesson';

@Component({
  selector: 'app-daily-lesson-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="daily-lesson-card card">
      <span class="today-eyebrow">Chapter {{ lesson.chapter.index.toString().padStart(2, '0') }} of 19</span>
      <h4>{{ lesson.chapter.title }}</h4>
      <p class="daily-lesson-try-it">💡 {{ lesson.tryItNow }}</p>
      <button class="btn btn-secondary btn-sm" (click)="openChapter.emit(lesson.chapter.id)">Read the full chapter →</button>
    </div>
  `
})
export class DailyLessonCardComponent {
  @Output() openChapter = new EventEmitter<string>();

  lesson = getDailyLesson();
}
