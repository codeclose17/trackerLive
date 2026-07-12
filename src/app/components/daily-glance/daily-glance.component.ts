import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
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

      <div class="glance-split-layout">
        <!-- COLUMN 1: SELECTED CARD DETAILED VIEW (30%) -->
        <div class="glance-detail-col">
          <div class="glance-detail-card card" [class.today]="isToday(selectedGlanceDate)">
            <div class="detail-card-header">
              <div class="card-day-info">
                <span class="day-long">{{ getDayNameLong(selectedGlanceDate) }}</span>
                <span class="date-short">{{ getFormattedDate(selectedGlanceDate) }}</span>
              </div>
              <span *ngIf="isToday(selectedGlanceDate)" class="today-badge">Today</span>
            </div>

            <!-- Large Hour breakdown strip -->
            <div class="detail-hour-strip-section">
              <h5>Hour Breakdown</h5>
              <div class="mini-hour-strip large">
                <div
                  *ngFor="let catId of getRecordHours(selectedGlanceDate); let h = index"
                  class="mini-hour-cell"
                  [style.backgroundColor]="getCellColor(catId)"
                  [title]="h + ':00 - ' + getCellName(catId)"
                ></div>
              </div>
            </div>

            <!-- Category Time Allocation progress -->
            <div class="detail-allocations-section">
              <h5>Category Breakdown</h5>
              <div class="detail-alloc-list">
                <ng-container *ngFor="let cat of categories">
                  <div *ngIf="getHourCount(selectedGlanceDate, cat.id) > 0" class="detail-alloc-row">
                    <div class="alloc-row-meta">
                      <span class="alloc-row-name">
                        <span class="dot" [style.backgroundColor]="cat.color"></span>
                        {{ cat.name }}
                      </span>
                      <span class="alloc-row-hours">{{ getHourCount(selectedGlanceDate, cat.id) }} hrs</span>
                    </div>
                    <div class="alloc-row-progress-track">
                      <div
                        class="alloc-row-progress-fill"
                        [style.backgroundColor]="cat.color"
                        [style.width.%]="(getHourCount(selectedGlanceDate, cat.id) / 24) * 100"
                      ></div>
                    </div>
                  </div>
                </ng-container>
                <div *ngIf="isEmptyAllocation(selectedGlanceDate)" class="muted-text italic-text" style="font-size: 0.8rem; padding: 0.25rem 0;">
                  No hours painted for this day.
                </div>
              </div>
            </div>

            <!-- Full reflections -->
            <div class="detail-notes-section">
              <h5>Reflections</h5>
              <div class="detail-notes-body" [class.empty]="!getNotes(selectedGlanceDate)">
                {{ getFormattedNotes(selectedGlanceDate) || 'No notes logged for this day.' }}
              </div>
            </div>

            <!-- Edit Button link to grid -->
            <button class="btn btn-primary edit-day-btn" (click)="handleEditClick(selectedGlanceDate)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              <span>Edit Hours</span>
            </button>
          </div>
        </div>

        <!-- COLUMN 2: LIST OF 14 CARDS (70%) -->
        <div class="glance-cards-col">
          <div class="glance-cards-grid scrollable">
            <div
              *ngFor="let dateStr of dates"
              class="glance-day-card card"
              [class.today]="isToday(dateStr)"
              [class.active]="selectedGlanceDate === dateStr"
              (click)="selectGlanceDate(dateStr)"
              title="Click to view details on the left"
            >
              <!-- Card Header -->
              <div class="card-title-row">
                <div class="card-day-info">
                  <span class="day-long">{{ getDayNameLong(dateStr) }}</span>
                  <span class="date-short">{{ getFormattedDate(dateStr) }}</span>
                </div>
                <span *ngIf="isToday(dateStr)" class="today-badge">Today</span>
              </div>

              <!-- Mini Hour strip -->
              <div class="mini-hour-strip">
                <div
                  *ngFor="let catId of getRecordHours(dateStr)"
                  class="mini-hour-cell"
                  [style.backgroundColor]="getCellColor(catId)"
                ></div>
              </div>

              <!-- Time Allocation summary -->
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
                    No hours logged.
                  </div>
                </div>
              </div>

              <!-- Reflection Preview -->
              <div class="reflection-preview-box">
                <h5>Reflections</h5>
                <p class="reflection-text" [class.empty]="!getNotes(dateStr)">
                  {{ getFormattedNotes(dateStr) || 'No daily notes written.' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DailyGlanceComponent implements OnChanges {
  @Input() dates: string[] = [];
  @Input() records: Record<string, DayRecord> = {};
  @Input() categories: Category[] = [];
  @Input() selectedDate = '';

  @Output() selectDateAndTab = new EventEmitter<{ date: string; tab: 'grid' | 'stats' | 'glance' }>();

  selectedGlanceDate = '';

  ngOnChanges(): void {
    // Synchronize selectedGlanceDate with active selectedDate if valid
    if (this.dates.includes(this.selectedDate)) {
      this.selectedGlanceDate = this.selectedDate;
    } else if (!this.selectedGlanceDate || !this.dates.includes(this.selectedGlanceDate)) {
      this.selectedGlanceDate = this.dates[0] || '';
    }
  }

  selectGlanceDate(dateStr: string): void {
    this.selectedGlanceDate = dateStr;
  }

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

  getFormattedNotes(dateStr: string): string {
    const notes = this.getNotes(dateStr);
    if (!notes) return '';
    return notes.split('\n').map(line => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith('->')) {
        const leadingSpacesCount = line.length - trimmed.length;
        return ' '.repeat(leadingSpacesCount) + '• ' + trimmed.substring(2).trimStart();
      }
      return line;
    }).join('\n');
  }

  handleEditClick(dateStr: string): void {
    this.selectDateAndTab.emit({ date: dateStr, tab: 'grid' });
  }
}
