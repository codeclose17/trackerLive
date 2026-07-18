import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImpulseLogEntry } from '../../types';
import { computeTriggerHeatmap, getHotCells, WEEKDAY_LABELS, HeatmapCell } from '../../utils/trigger-heatmap';

@Component({
  selector: 'app-trigger-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-card card trigger-heatmap-card">
      <div class="card-header-icon">
        <h3>🔥 Trigger heatmap</h3>
      </div>

      <div class="heatmap-grid" *ngIf="cells.length > 0">
        <div class="heatmap-row" *ngFor="let weekday of weekdays">
          <span class="heatmap-weekday-label">{{ weekdayLabel(weekday) }}</span>
          <div class="heatmap-cells">
            <div
              *ngFor="let hour of hours"
              class="heatmap-cell"
              [style.opacity]="cellOpacity(weekday, hour)"
              [title]="weekdayLabel(weekday) + ' ' + hour + ':00 — ' + cellCount(weekday, hour) + ' impulse(s)'"
            ></div>
          </div>
        </div>
      </div>

      <div class="heatmap-hot-cells" *ngIf="hotCells.length > 0">
        <span class="heatmap-hot-label">Hot spots</span>
        <div class="heatmap-hot-item" *ngFor="let cell of hotCells.slice(0, 5)">
          <span>{{ weekdayLabel(cell.weekday) }} {{ cell.hour.toString().padStart(2, '0') }}:00 — {{ cell.count }} impulses</span>
          <button class="btn btn-secondary btn-sm" (click)="preCommit.emit(cell)">Pre-commit a block here</button>
        </div>
      </div>

      <p class="muted-text italic-text" *ngIf="cells.length === 0 || hotCells.length === 0">
        Not enough impulse data yet to spot a pattern. Keep logging urges to build this up.
      </p>
    </div>
  `
})
export class TriggerHeatmapComponent {
  @Input() impulseEntries: ImpulseLogEntry[] = [];
  @Output() preCommit = new EventEmitter<HeatmapCell>();

  weekdays = [0, 1, 2, 3, 4, 5, 6];
  hours = Array.from({ length: 24 }, (_, i) => i);

  weekdayLabel(weekday: number): string {
    return WEEKDAY_LABELS[weekday];
  }

  get cells(): HeatmapCell[] {
    return computeTriggerHeatmap(this.impulseEntries);
  }

  get hotCells(): HeatmapCell[] {
    return getHotCells(this.cells);
  }

  private get maxCount(): number {
    return Math.max(1, ...this.cells.map(c => c.count));
  }

  cellCount(weekday: number, hour: number): number {
    return this.cells.find(c => c.weekday === weekday && c.hour === hour)?.count || 0;
  }

  cellOpacity(weekday: number, hour: number): number {
    const count = this.cellCount(weekday, hour);
    if (count === 0) return 0.08;
    return Math.min(1, 0.25 + (count / this.maxCount) * 0.75);
  }
}
