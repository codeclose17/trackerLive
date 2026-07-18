import { Component, Input, Output, EventEmitter, HostListener, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category, DayRecord, PlannedBlock } from '../../types';

@Component({
  selector: 'app-today-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="today-view">
      <!-- HEADER: date + waking-day dial -->
      <div class="today-header">
        <div class="today-header-info">
          <span class="today-eyebrow">Today</span>
          <h2>{{ fullDateDisplay }}</h2>
        </div>
        <div class="today-dial" [title]="dialPercent + '% of the waking day elapsed'">
          <svg viewBox="0 0 44 44" class="dial-svg">
            <circle class="dial-track" cx="22" cy="22" r="19"></circle>
            <circle
              class="dial-fill"
              cx="22" cy="22" r="19"
              [style.strokeDasharray]="dialCircumference"
              [style.strokeDashoffset]="dialOffset"
            ></circle>
          </svg>
          <span class="dial-label">{{ dialPercent }}%</span>
        </div>
      </div>

      <!-- NEXT UP: the single next planned block, with the app's one primary action -->
      <div class="next-up-card card" *ngIf="nextBlock; else noNextBlock">
        <span class="next-up-eyebrow">Next up · {{ nextBlock.time }}</span>
        <p class="next-up-text">
          I will {{ nextBlock.action }}<ng-container *ngIf="nextBlock.place"> at {{ nextBlock.place }}</ng-container>
        </p>
        <button class="btn btn-primary next-up-cta" (click)="markNextBlockDone()">Mark done</button>
      </div>
      <ng-template #noNextBlock>
        <div class="next-up-card next-up-empty card">
          <span class="next-up-eyebrow">Next up</span>
          <p class="next-up-text">Nothing planned yet.</p>
          <button class="btn btn-primary next-up-cta" (click)="focusPlanner.emit()">Plan your next block</button>
        </div>
      </ng-template>

      <!-- 24-HOUR VERTICAL TIMELINE (all 24 hours of today, single scroll) -->
      <div class="today-timeline-wrapper card">
        <div class="today-timeline" [class.two-col]="true">
          <div
            *ngFor="let hIdx of hoursArray"
            class="today-hour-row"
            [class.now]="hIdx === currentHour"
            [id]="'hour-' + hIdx"
            (mousedown)="handleMouseDown(hIdx, $event)"
            (mouseenter)="handleMouseEnter(hIdx, $event)"
            (touchstart)="handleTouchStart(hIdx, $event)"
            (touchmove)="handleTouchMove($event)"
            (dblclick)="handleDoubleClick(hIdx)"
          >
            <span class="today-hour-label">{{ hIdx.toString().padStart(2, '0') }}:00</span>
            <div
              class="today-hour-box"
              [class.filled]="getHourCategory(hIdx) !== 'idle'"
              [style.backgroundColor]="getCellColor(hIdx)"
              [title]="hIdx + ':00 — ' + getCellName(hIdx) + ' (drag to paint, double-click to clear)'"
            ></div>
            <span class="today-hour-cat-name">{{ getCellName(hIdx) }}</span>
            <span *ngIf="hIdx === currentHour" class="now-marker" aria-hidden="true">now</span>
          </div>
        </div>
      </div>

      <!-- BINGE / IMPULSE COUNT -->
      <div class="today-binge-row card">
        <span class="binge-label">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          Binge / Impulse Count Today:
        </span>
        <div class="binge-counter">
          <button class="btn btn-secondary btn-icon btn-sm-square" (click)="adjustBingeCount(-1)">-</button>
          <span class="binge-value">{{ bingeCount }}</span>
          <button class="btn btn-secondary btn-icon btn-sm-square" (click)="adjustBingeCount(1)">+</button>
        </div>
      </div>

      <!-- NOTES -->
      <div class="today-notes-section card">
        <h4>Today's Reflections</h4>
        <textarea
          class="form-input notes-textarea"
          placeholder="How's today going? Write down your reflections, struggles, or highlights..."
          [ngModel]="notes"
          (ngModelChange)="onNotesChange($event)"
        ></textarea>
      </div>
    </div>
  `
})
export class TodayViewComponent implements OnInit, OnDestroy, OnChanges {
  @Input() date = '';
  @Input() record: DayRecord | null = null;
  @Input() categories: Category[] = [];
  @Input() activeCategoryId = '';

  @Output() paintHour = new EventEmitter<{ date: string; hourIndex: number; categoryId: string }>();
  @Output() updateNotes = new EventEmitter<{ date: string; notes: string }>();
  @Output() updateBingeCount = new EventEmitter<{ date: string; count: number }>();
  @Output() plannedBlocksChange = new EventEmitter<{ date: string; blocks: PlannedBlock[] }>();
  /** ONE primary CTA when nothing is planned yet: hand focus to the planner below. */
  @Output() focusPlanner = new EventEmitter<void>();

  hoursArray = Array.from({ length: 24 }, (_, i) => i);
  currentHour = new Date().getHours();
  fullDateDisplay = '';
  dialPercent = 0;
  dialCircumference = 2 * Math.PI * 19;
  dialOffset = this.dialCircumference;

  private isPointerDown = false;
  private clockTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.refreshClock();
    this.clockTimer = setInterval(() => this.refreshClock(), 60_000);
  }

  ngOnChanges(): void {
    this.refreshDateDisplay();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  @HostListener('window:mouseup')
  onWindowMouseUp(): void {
    this.isPointerDown = false;
  }

  private refreshClock(): void {
    const now = new Date();
    this.currentHour = now.getHours();

    const WAKE_HOUR = 6;
    const SLEEP_HOUR = 23;
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const total = (SLEEP_HOUR - WAKE_HOUR) * 60;
    const elapsed = minutesNow - WAKE_HOUR * 60;
    const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
    this.dialPercent = Math.round(pct);
    this.dialOffset = this.dialCircumference * (1 - pct / 100);
    this.refreshDateDisplay();
  }

  private refreshDateDisplay(): void {
    if (!this.date) return;
    const d = new Date(this.date);
    this.fullDateDisplay = d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }

  /** The single next undone planned block, by time — the "Next up" card and
   * the ONE primary CTA on this screen (step 9). */
  get nextBlock(): PlannedBlock | null {
    const blocks = (this.record?.plannedBlocks || []).filter(b => !b.done);
    if (blocks.length === 0) return null;
    return [...blocks].sort((a, b) => a.time.localeCompare(b.time))[0];
  }

  markNextBlockDone(): void {
    const next = this.nextBlock;
    if (!next) return;
    const allBlocks = this.record?.plannedBlocks || [];
    const updated = allBlocks.map(b => b.id === next.id ? { ...b, done: true } : b);
    this.plannedBlocksChange.emit({ date: this.date, blocks: updated });
  }

  get notes(): string {
    return this.record?.notes || '';
  }

  get bingeCount(): number {
    return this.record?.bingeCount || 0;
  }

  getHourCategory(hIdx: number): string {
    return this.record?.hours?.[hIdx] ?? 'idle';
  }

  getCellColor(hIdx: number): string {
    const catId = this.getHourCategory(hIdx);
    if (catId === 'idle') return 'var(--color-idle)';
    const cat = this.categories.find(c => c.id === catId);
    return cat ? cat.color : 'var(--color-idle)';
  }

  getCellName(hIdx: number): string {
    const catId = this.getHourCategory(hIdx);
    const cat = this.categories.find(c => c.id === catId);
    return cat ? cat.name : 'Idle / Uncategorized';
  }

  private paint(hIdx: number, shiftKey: boolean): void {
    const categoryId = shiftKey ? 'idle' : this.activeCategoryId;
    this.paintHour.emit({ date: this.date, hourIndex: hIdx, categoryId });
  }

  handleMouseDown(hIdx: number, event: MouseEvent): void {
    this.isPointerDown = true;
    this.paint(hIdx, event.shiftKey);
  }

  handleMouseEnter(hIdx: number, event: MouseEvent): void {
    if (this.isPointerDown) {
      this.paint(hIdx, event.shiftKey);
    }
  }

  handleDoubleClick(hIdx: number): void {
    this.paintHour.emit({ date: this.date, hourIndex: hIdx, categoryId: 'idle' });
  }

  handleTouchStart(hIdx: number, event: TouchEvent): void {
    event.preventDefault();
    this.paint(hIdx, false);
  }

  handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = el?.closest('.today-hour-row');
    if (!row || !row.id) return;
    const hIdx = parseInt(row.id.replace('hour-', ''), 10);
    if (!isNaN(hIdx)) {
      this.paint(hIdx, false);
    }
  }

  adjustBingeCount(amount: number): void {
    const next = Math.max(0, this.bingeCount + amount);
    this.updateBingeCount.emit({ date: this.date, count: next });
  }

  onNotesChange(newNotes: string): void {
    this.updateNotes.emit({ date: this.date, notes: newNotes });
  }
}
