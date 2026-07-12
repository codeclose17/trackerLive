import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category, DayRecord } from '../../types';

@Component({
  selector: 'app-tracker-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid-dashboard-container">
      <!-- LEFT COLUMN: THE TRACKER GRID -->
      <div class="tracker-grid-card card">
        <div class="hour-labels-header">
          <div class="date-spacer">Date</div>
          <div class="hours-row-header">
            <div
              *ngFor="let hour of hoursArray; let i = index"
              class="hour-label-cell"
              [title]="'Hour ' + i + ':00'"
              [style.gridColumn]="i + 1"
              [style.opacity]="i % 4 === 0 ? 1 : 0.4"
            >
              {{ i.toString().padStart(2, '0') }}
            </div>
          </div>
          <!-- Right Spacer for Lock Button -->
          <div style="width: 36px; flex-shrink: 0;"></div>
        </div>

        <div class="grid-rows-container">
          <div
            *ngFor="let dateStr of dates"
            class="grid-row-wrapper"
            [class.selected]="dateStr === selectedDate"
            [class.today]="isToday(dateStr)"
            (click)="selectDate.emit(dateStr)"
          >
            <div class="row-date-label">
              <span class="day-name">{{ getDayOfWeek(dateStr) }}</span>
              <span class="date-number">{{ getFormattedDate(dateStr) }}</span>
              
              <span *ngIf="hasNotes(dateStr)" class="notes-indicator-dot" title="Has daily notes">
                <!-- BookOpen SVG -->
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5 15 8.5M4 19.5c0 .8.6 1.5 1.5 1.5H20M4 19.5c0-.8.6-1.5 1.5-1.5H20M20 4v17M4 4h16"/></svg>
              </span>
              
              <span *ngIf="isToday(dateStr)" class="today-badge">Today</span>
            </div>

            <div class="hours-grid">
              <div
                *ngFor="let catId of getRecordHours(dateStr); let hIdx = index"
                class="hour-box"
                [class.filled]="catId !== 'idle'"
                [class.idle]="catId === 'idle'"
                [style.backgroundColor]="getCellColor(catId)"
                [style.hoverGlow]="getCellColor(catId) + '33'"
                (mousedown)="handleCellMouseDown(dateStr, hIdx, $event)"
                (mouseenter)="handleCellMouseEnter(dateStr, hIdx, $event)"
                (dblclick)="handleCellDoubleClick(dateStr, hIdx)"
                [title]="getHourRangeText(hIdx) + ': ' + getCellName(catId) + ' (Shift + Drag or Double click to clear)'"
              >
                <span class="cell-hour-number">{{ hIdx }}</span>
              </div>
            </div>

            <!-- Lock / Unlock Button -->
            <button
              class="row-lock-btn"
              [class.locked]="isRowLocked(dateStr)"
              (click)="toggleRowLock(dateStr, $event)"
              [title]="isRowLocked(dateStr) ? 'Unlock row for editing' : 'Lock row to prevent changes'"
            >
              <!-- Locked Icon SVG -->
              <svg *ngIf="isRowLocked(dateStr)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <!-- Unlocked Icon SVG -->
              <svg *ngIf="!isRowLocked(dateStr)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 10V7a5 5 0 0 1 9.9-1"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: SELECTED DAY STATS & NOTES -->
      <div class="day-details-panel card">
        <div class="panel-header">
          <h3>Day Details</h3>
          <span class="panel-date">
            {{ getFullDateDisplay(selectedDate) }}
          </span>
        </div>

        <!-- Selected Day Stats Breakdown -->
        <div class="panel-section day-stats-breakdown">
          <h4>
            <!-- Clock Icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Time Allocation
          </h4>
          
          <div class="day-stats-bars">
            <ng-container *ngFor="let cat of categories">
              <div *ngIf="getHourCount(cat.id) > 0 || cat.id !== 'idle'" class="day-stat-bar-row">
                <div class="bar-row-info">
                  <span class="bar-row-name">
                    <span class="dot" [style.backgroundColor]="cat.color"></span>
                    {{ cat.id === 'idle' ? 'Eraser (Idle)' : cat.name }}
                  </span>
                  <span class="bar-row-value">
                    {{ getHourCount(cat.id) }} {{ getHourCount(cat.id) === 1 ? 'hr' : 'hrs' }} ({{ getPercentage(cat.id) }}%)
                  </span>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    [style.backgroundColor]="cat.color"
                    [style.width.%]="getPercentage(cat.id)"
                    [style.boxShadow]="'0 0 8px ' + cat.color + '33'"
                  ></div>
                </div>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Notes Section -->
        <div class="panel-section day-notes-section">
          <h4>
            <!-- BookOpen SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;"><path d="M4 19.5 15 8.5M4 19.5c0 .8.6 1.5 1.5 1.5H20M4 19.5c0-.8.6-1.5 1.5-1.5H20M20 4v17M4 4h16"/></svg>
            Daily Notes & Reflections
          </h4>
          <textarea
            class="form-input notes-textarea"
            placeholder="How did today go? Write down your reflections, struggles, or highlights..."
            [ngModel]="getSelectedNotes()"
            (ngModelChange)="onNotesChange($event)"
          ></textarea>
          <!-- Binge Count Section instead of tip -->
          <div class="binge-count-section">
            <span class="binge-label">
              <!-- AlertCircle SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-color);"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              Daily Binge Count:
            </span>
            <div class="binge-counter">
              <button class="btn btn-secondary btn-icon btn-sm-square" (click)="adjustBingeCount(-1)" [disabled]="isRowLocked(selectedDate)">-</button>
              <span class="binge-value">{{ getSelectedBingeCount() }}</span>
              <button class="btn btn-secondary btn-icon btn-sm-square" (click)="adjustBingeCount(1)" [disabled]="isRowLocked(selectedDate)">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TrackerGridComponent {
  @Input() dates: string[] = [];
  @Input() records: Record<string, DayRecord> = {};
  @Input() categories: Category[] = [];
  @Input() selectedDate = '';
  @Input() activeCategoryId = '';

  @Output() paintCell = new EventEmitter<{ date: string; hourIndex: number; categoryId: string }>();
  @Output() selectDate = new EventEmitter<string>();
  @Output() updateNotes = new EventEmitter<{ date: string; notes: string }>();
  @Output() updateBingeCount = new EventEmitter<{ date: string; count: number }>();

  hoursArray = Array(24).fill(0);
  lockedDates: Record<string, boolean> = {};
  private isMouseDown = false;

  @HostListener('window:mouseup')
  onMouseUp(): void {
    this.isMouseDown = false;
  }

  isToday(dateStr: string): boolean {
    const today = new Date().toLocaleDateString();
    const target = new Date(dateStr).toLocaleDateString();
    return today === target;
  }

  getDayOfWeek(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }

  getFormattedDate(dateStr: string): string {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString(undefined, { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  }

  getFullDateDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  hasNotes(dateStr: string): boolean {
    const record = this.records[dateStr];
    return !!(record && record.notes && record.notes.trim().length > 0);
  }

  getRecordHours(dateStr: string): string[] {
    const record = this.records[dateStr];
    return record ? record.hours : Array(24).fill('idle');
  }

  getCellColor(catId: string): string {
    const cat = this.categories.find(c => c.id === catId);
    return cat ? cat.color : 'var(--color-idle)';
  }

  getCellName(catId: string): string {
    const cat = this.categories.find(c => c.id === catId);
    return cat ? cat.name : 'Idle / Uncategorized';
  }

  isRowLocked(dateStr: string): boolean {
    if (this.lockedDates[dateStr] !== undefined) {
      return this.lockedDates[dateStr];
    }
    // Default today to UNLOCKED, past/future dates to LOCKED
    return !this.isToday(dateStr);
  }

  toggleRowLock(dateStr: string, event: Event): void {
    event.stopPropagation(); // Prevent row selection trigger
    this.lockedDates[dateStr] = !this.isRowLocked(dateStr);
  }

  handleCellMouseDown(dateStr: string, hourIndex: number, event: MouseEvent): void {
    if (this.isRowLocked(dateStr)) return;
    this.isMouseDown = true;
    this.selectDate.emit(dateStr);
    const paintColor = event.shiftKey ? 'idle' : this.activeCategoryId;
    this.paintCell.emit({ date: dateStr, hourIndex, categoryId: paintColor });
  }

  handleCellMouseEnter(dateStr: string, hourIndex: number, event: MouseEvent): void {
    if (this.isRowLocked(dateStr)) return;
    if (this.isMouseDown) {
      const paintColor = event.shiftKey ? 'idle' : this.activeCategoryId;
      this.paintCell.emit({ date: dateStr, hourIndex, categoryId: paintColor });
    }
  }

  handleCellDoubleClick(dateStr: string, hourIndex: number): void {
    if (this.isRowLocked(dateStr)) return;
    this.paintCell.emit({ date: dateStr, hourIndex, categoryId: 'idle' });
  }

  getHourRangeText(index: number): string {
    const start = index.toString().padStart(2, '0');
    const end = ((index + 1) % 24).toString().padStart(2, '0');
    return `${start}:00 - ${end}:00`;
  }

  // Selected Day Notes
  getSelectedNotes(): string {
    const record = this.records[this.selectedDate];
    return record ? record.notes : '';
  }

  onNotesChange(newNotes: string): void {
    this.updateNotes.emit({ date: this.selectedDate, notes: newNotes });
  }

  getSelectedBingeCount(): number {
    const record = this.records[this.selectedDate];
    return record && record.bingeCount ? record.bingeCount : 0;
  }

  adjustBingeCount(amount: number): void {
    if (this.isRowLocked(this.selectedDate)) return;
    const current = this.getSelectedBingeCount();
    const newCount = Math.max(0, current + amount);
    this.updateBingeCount.emit({ date: this.selectedDate, count: newCount });
  }

  // Selected Day Stats helpers
  getHourCount(catId: string): number {
    const record = this.records[this.selectedDate];
    if (!record) return 0;
    return record.hours.filter(h => h === catId).length;
  }

  getPercentage(catId: string): number {
    const count = this.getHourCount(catId);
    return Math.round((count / 24) * 100);
  }
}
