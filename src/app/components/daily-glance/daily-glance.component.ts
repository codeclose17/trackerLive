import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, DayRecord } from '../../types';

@Component({
  selector: 'app-daily-glance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glance-dashboard-container">
      <div class="glance-header">
        <h2>14-Day Daily Glance</h2>
        <p class="subtitle">Fortnight overview showing painted time strips, daily summaries, and written reflections.</p>
      </div>

      <div class="glance-cards-grid">
        <div
          *ngFor="let dateStr of dates"
          class="glance-day-card card"
          [class.today]="isToday(dateStr)"
          (click)="handleCardClick(dateStr)"
          title="Click to select this day in the grid editor"
        >
          <!-- 1. Card Header -->
          <div class="card-title-row">
            <div class="card-day-info">
              <span class="day-long">{{ getDayNameLong(dateStr) }}</span>
              <span class="date-short">{{ getFormattedDate(dateStr) }}</span>
            </div>
            <span *ngIf="isToday(dateStr)" class="today-badge">Today</span>
          </div>

          <!-- 2. Mini Hour strip -->
          <div class="mini-hour-strip">
            <div
              *ngFor="let catId of getRecordHours(dateStr)"
              class="mini-hour-cell"
              [style.backgroundColor]="getCellColor(catId)"
              [title]="catId === 'idle' ? 'Idle / Uncategorized' : getCellName(catId)"
            ></div>
          </div>

          <!-- 3. Time Allocation summary -->
          <div class="mini-allocation-summary">
            <div class="allocation-badges">
              <ng-container *ngFor="let cat of categories">
                <span
                  *ngIf="getHourCount(dateStr, cat.id) > 0"
                  class="alloc-badge"
                  [style.borderColor]="cat.color + '44'"
                  [style.background]="cat.color + '10'"
                >
                  <span class="dot" [style.backgroundColor]="cat.color"></span>
                  <span class="lbl">{{ cat.name }}: {{ getHourCount(dateStr, cat.id) }}h</span>
                </span>
              </ng-container>
              <div *ngIf="isEmptyAllocation(dateStr)" class="muted-text italic-text" style="font-size: 0.75rem;">
                No hours logged yet.
              </div>
            </div>
          </div>

          <!-- 4. Reflection Preview -->
          <div class="reflection-preview-box">
            <h5>Reflections</h5>
            <p class="reflection-text" [class.empty]="!getNotes(dateStr)">
              {{ getNotes(dateStr) || 'No daily notes written yet.' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DailyGlanceComponent {
  @Input() dates: string[] = [];
  @Input() records: Record<string, DayRecord> = {};
  @Input() categories: Category[] = [];

  @Output() selectDateAndTab = new EventEmitter<{ date: string; tab: 'grid' | 'stats' | 'glance' }>();

  isToday(dateStr: string): boolean {
    const today = new Date().toLocaleDateString();
    const target = new Date(dateStr).toLocaleDateString();
    return today === target;
  }

  getDayNameLong(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  getFormattedDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  getRecordHours(dateStr: string): string[] {
    const rec = this.records[dateStr];
    return rec ? rec.hours : Array(24).fill('idle');
  }

  getCellColor(catId: string): string {
    const cat = this.categories.find(c => c.id === catId);
    return cat ? cat.color : 'var(--color-idle)';
  }

  getCellName(catId: string): string {
    const cat = this.categories.find(c => c.id === catId);
    return cat ? cat.name : 'Idle';
  }

  getHourCount(dateStr: string, catId: string): number {
    const rec = this.records[dateStr];
    if (!rec) return 0;
    return rec.hours.filter(h => h === catId).length;
  }

  isEmptyAllocation(dateStr: string): boolean {
    const rec = this.records[dateStr];
    if (!rec) return true;
    return rec.hours.every(h => h === 'idle');
  }

  getNotes(dateStr: string): string {
    const rec = this.records[dateStr];
    return rec ? rec.notes : '';
  }

  handleCardClick(dateStr: string): void {
    this.selectDateAndTab.emit({ date: dateStr, tab: 'grid' });
  }
}
