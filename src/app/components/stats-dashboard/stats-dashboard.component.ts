import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, DayRecord, ImpulseLogEntry } from '../../types';
import { computeInsights, Insight } from '../../utils/insights';
import { TriggerHeatmapComponent } from '../trigger-heatmap/trigger-heatmap.component';
import { HeatmapCell } from '../../utils/trigger-heatmap';

interface CycleOverlayRow {
  cycleDay: number;
  impulseCount: number;
  severityPercent: number;
}

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule, TriggerHeatmapComponent],
  template: `
    <div class="stats-dashboard-grid">
      <!-- CARD 1: OVERALL BREAKDOWN -->
      <div class="stats-card card">
        <div class="card-header-icon">
          <!-- TrendingUp SVG -->
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          <h3>14-Day Range Breakdown</h3>
        </div>
        
        <div class="stats-total-hours">
          <span class="number">{{ activeRecordsCount }}</span> / {{ dates.length }} Days Tracked
        </div>

        <div class="stats-bars-list">
          <ng-container *ngFor="let cat of categories">
            <div *ngIf="getCategoryTotal(cat.id) > 0 || cat.id !== 'idle'" class="stat-percentage-row">
              <div class="stat-label">
                <span class="dot" [style.backgroundColor]="cat.color"></span>
                <span class="name">{{ cat.id === 'idle' ? 'Eraser (Idle)' : cat.name }}</span>
              </div>
              <div class="stat-bar-container">
                <div class="bar-track">
                  <div 
                    class="bar-fill" 
                    [style.backgroundColor]="cat.color"
                    [style.width.%]="getCategoryPercentage(cat.id)"
                    [style.boxShadow]="'0 0 10px ' + cat.color + '44'"
                  ></div>
                </div>
                <span class="value-pct">{{ getCategoryPercentage(cat.id) }}% ({{ getCategoryTotal(cat.id) }}h)</span>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- CARD 2: DAILY AVERAGES -->
      <div class="stats-card card">
        <div class="card-header-icon">
          <!-- Zap SVG -->
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <h3>Daily Averages</h3>
        </div>

        <div class="averages-grid">
          <ng-container *ngFor="let cat of categories">
            <div *ngIf="cat.id !== 'idle'" class="avg-box" [style.borderLeftColor]="cat.color">
              <div class="avg-title" [style.color]="cat.color">{{ cat.name }}</div>
              <div class="avg-val">
                <span class="big-num">{{ getCategoryAverage(cat.id) }}</span> hrs/day
              </div>
            </div>
          </ng-container>
          <!-- Daily Binge Count Average Box -->
          <div class="avg-box binge-avg-box" style="border-left-color: var(--accent-color);">
            <div class="avg-title" style="color: var(--accent-color);">Daily Binges</div>
            <div class="avg-val">
              <span class="big-num">{{ getBingeAverage() }}</span> per day
            </div>
          </div>
        </div>
      </div>

      <!-- CARD 3: FOCUS INSIGHTS (mechanism-citing, cross-metric correlations — step 39) -->
      <div class="stats-card card insight-card" [ngClass]="insight.type">
        <div class="card-header-icon">
          <!-- Award SVG (Success) -->
          <svg *ngIf="insight.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>

          <!-- Info SVG (Others) -->
          <svg *ngIf="insight.type !== 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
          <h3>Focus Insights</h3>
        </div>

        <div class="insight-body">
          <h4 class="insight-title">{{ insight.title }}</h4>
          <p class="insight-message">{{ insight.message }}</p>
          <p class="insight-mechanism"><b>Why:</b> {{ insight.mechanism }}</p>
        </div>

        <div class="insight-footer">
          <button class="regulator-kb-link" (click)="openKb.emit(insight.kbAnchor)">Read the mechanism in full →</button>
        </div>
      </div>

      <!-- CARD 4: CYCLE OVERLAY (opt-in only, step 34) -->
      <div class="stats-card card" *ngIf="cycleAwareModeEnabled">
        <div class="card-header-icon">
          <h3>🌙 Cycle vs symptoms</h3>
        </div>
        <div class="cycle-overlay-list" *ngIf="cycleOverlayRows.length > 0; else noCycleData">
          <div class="cycle-overlay-row" *ngFor="let row of cycleOverlayRows">
            <span class="cycle-overlay-day">Day {{ row.cycleDay }}</span>
            <div class="cycle-overlay-bar-track">
              <div class="cycle-overlay-bar-fill" [style.width.%]="row.severityPercent"></div>
            </div>
            <span class="cycle-overlay-count">{{ row.impulseCount }} impulse{{ row.impulseCount === 1 ? '' : 's' }}</span>
          </div>
        </div>
        <ng-template #noCycleData>
          <p class="muted-text italic-text">No cycle-day + impulse data logged together yet. Log your cycle day on Today to see the overlay build up here.</p>
        </ng-template>
      </div>

      <!-- CARD 5: TRIGGER HEATMAP (step 42) -->
      <app-trigger-heatmap
        [impulseEntries]="impulseEntries"
        (preCommit)="preCommitBlock.emit($event)"
      ></app-trigger-heatmap>
    </div>
  `
})
export class StatsDashboardComponent implements OnChanges {
  @Input() dates: string[] = [];
  @Input() records: Record<string, DayRecord> = {};
  @Input() categories: Category[] = [];
  @Input() cycleAwareModeEnabled = false;
  @Input() impulseEntries: ImpulseLogEntry[] = [];

  @Output() openKb = new EventEmitter<string>();
  @Output() preCommitBlock = new EventEmitter<HeatmapCell>();

  activeRecordsCount = 0;
  private hourCounts: Record<string, number> = {};
  insight: Insight = {
    type: 'info',
    title: 'Start tracking',
    message: 'Paint some hours on Today to unlock personalized insights.',
    mechanism: 'Insights need at least a few days of real data to correlate against.',
    kbAnchor: 'definition'
  };

  ngOnChanges(): void {
    this.recalculateStats();
  }

  private recalculateStats(): void {
    // Reset
    this.activeRecordsCount = 0;
    this.hourCounts = {};
    this.categories.forEach(c => {
      this.hourCounts[c.id] = 0;
    });

    // Count
    this.dates.forEach((dateStr) => {
      const record = this.records[dateStr];
      if (record) {
        this.activeRecordsCount++;
        record.hours.forEach((catId) => {
          this.hourCounts[catId] = (this.hourCounts[catId] || 0) + 1;
        });
      }
    });

    // Generate insight: cross-metric correlation engine (step 39), replaces
    // the old category-average-only rules entirely.
    this.insight = computeInsights(this.dates, this.records, this.impulseEntries);
  }

  getCategoryTotal(catId: string): number {
    return this.hourCounts[catId] || 0;
  }

  getCategoryPercentage(catId: string): number {
    const totalHours = this.activeRecordsCount * 24 || this.dates.length * 24 || 1;
    const count = this.getCategoryTotal(catId);
    return Math.round((count / totalHours) * 100) || 0;
  }

  getCategoryAverage(catId: string): string {
    const total = this.getCategoryTotal(catId);
    const days = this.activeRecordsCount || this.dates.length || 1;
    return (total / days).toFixed(1);
  }

  getTotalBinges(): number {
    let total = 0;
    this.dates.forEach((dateStr) => {
      const record = this.records[dateStr];
      if (record && record.bingeCount) {
        total += record.bingeCount;
      }
    });
    return total;
  }

  getBingeAverage(): string {
    const total = this.getTotalBinges();
    const days = this.activeRecordsCount || this.dates.length || 1;
    return (total / days).toFixed(1);
  }

  // Cycle-day vs symptom overlay (step 34). Uses impulse-log entries as the
  // symptom proxy (something already being tracked) rather than inventing a
  // new severity input — one impulse-log entry per date, grouped by the
  // cycle day logged on that same date's DayRecord.
  get cycleOverlayRows(): CycleOverlayRow[] {
    const impulsesByDate: Record<string, number> = {};
    this.impulseEntries.forEach((entry) => {
      impulsesByDate[entry.date] = (impulsesByDate[entry.date] || 0) + 1;
    });

    const byCycleDay: Record<number, number> = {};
    this.dates.forEach((dateStr) => {
      const record = this.records[dateStr];
      if (record?.cycleDay === undefined || record.cycleDay === null) return;
      const impulses = impulsesByDate[dateStr] || 0;
      byCycleDay[record.cycleDay] = (byCycleDay[record.cycleDay] || 0) + impulses;
    });

    const rows = Object.entries(byCycleDay)
      .map(([cycleDay, impulseCount]) => ({ cycleDay: parseInt(cycleDay, 10), impulseCount }))
      .sort((a, b) => a.cycleDay - b.cycleDay);

    const maxCount = Math.max(1, ...rows.map(r => r.impulseCount));
    return rows.map(r => ({ ...r, severityPercent: Math.round((r.impulseCount / maxCount) * 100) }));
  }
}
