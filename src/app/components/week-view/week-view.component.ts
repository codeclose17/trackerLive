import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, DayRecord, Task } from '../../types';

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="week-view">
      <div class="week-header">
        <button class="btn btn-secondary btn-icon" (click)="prevWeek.emit()" title="Previous week">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="week-header-info">
          <h2>{{ weekRangeText }}</h2>
          <p class="subtitle">A 7-day rhythm view — enough to see patterns, not enough to overwhelm.</p>
        </div>
        <button class="btn btn-secondary btn-icon" (click)="nextWeek.emit()" title="Next week">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      <div class="week-strips">
        <div
          *ngFor="let dateStr of dates"
          class="week-day-strip card"
          [class.today]="isToday(dateStr)"
          (click)="openDay.emit(dateStr)"
          role="button"
          tabindex="0"
          (keydown.enter)="openDay.emit(dateStr)"
        >
          <div class="week-strip-info">
            <span class="day-long">{{ getDayNameLong(dateStr) }}</span>
            <span class="date-short">{{ getFormattedDate(dateStr) }}</span>
            <span *ngIf="isToday(dateStr)" class="today-badge">Today</span>
          </div>

          <div class="mini-hour-strip">
            <div
              *ngFor="let catId of getRecordHours(dateStr)"
              class="mini-hour-cell"
              [style.backgroundColor]="getCellColor(catId)"
            ></div>
          </div>

          <div class="week-strip-meta">
            <span *ngIf="getBingeCount(dateStr) > 0" class="binge-pill">⚠️ {{ getBingeCount(dateStr) }}</span>
            <span *ngIf="hasNotes(dateStr)" class="notes-indicator-dot" title="Has notes">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5 15 8.5M4 19.5c0 .8.6 1.5 1.5 1.5H20M4 19.5c0-.8.6-1.5 1.5-1.5H20M20 4v17M4 4h16"/></svg>
            </span>
            <span *ngIf="getMilestonesForDate(dateStr).length > 0" class="milestone-pill" [title]="getMilestonesForDate(dateStr).length + ' milestone(s) due'">
              🎯 {{ getMilestonesForDate(dateStr).length }}
            </span>
            <button class="btn btn-secondary btn-icon btn-sm-square" (click)="editDay($event, dateStr)" title="Edit this day">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WeekViewComponent implements OnChanges {
  @Input() dates: string[] = []; // exactly 7 dates supplied by the parent
  @Input() records: Record<string, DayRecord> = {};
  @Input() categories: Category[] = [];
  @Input() tasks: Task[] = [];

  @Output() prevWeek = new EventEmitter<void>();
  @Output() nextWeek = new EventEmitter<void>();
  @Output() openDay = new EventEmitter<string>();

  weekRangeText = '';

  ngOnChanges(): void {
    if (this.dates.length === 0) {
      this.weekRangeText = '';
      return;
    }
    const start = new Date(this.dates[0]);
    const end = new Date(this.dates[this.dates.length - 1]);
    const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    this.weekRangeText = `${startStr} – ${endStr}`;
  }

  isToday(dateStr: string): boolean {
    const today = new Date().toLocaleDateString();
    const target = new Date(dateStr).toLocaleDateString();
    return today === target;
  }

  getDayNameLong(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long' });
  }

  getFormattedDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  getRecordHours(dateStr: string): string[] {
    const rec = this.records[dateStr];
    return rec ? rec.hours : Array(24).fill('idle');
  }

  getCellColor(catId: string): string {
    if (catId === 'idle') return 'var(--color-idle)';
    const cat = this.categories.find(c => c.id === catId);
    return cat ? cat.color : 'var(--color-idle)';
  }

  getBingeCount(dateStr: string): number {
    const rec = this.records[dateStr];
    return rec && rec.bingeCount ? rec.bingeCount : 0;
  }

  hasNotes(dateStr: string): boolean {
    const rec = this.records[dateStr];
    return !!(rec && rec.notes && rec.notes.trim().length > 0);
  }

  getMilestonesForDate(dateStr: string): Task[] {
    return this.tasks.filter(t => t.isMilestone && !t.done && t.dueDate === dateStr);
  }

  editDay(event: Event, dateStr: string): void {
    event.stopPropagation();
    this.openDay.emit(dateStr);
  }
}
