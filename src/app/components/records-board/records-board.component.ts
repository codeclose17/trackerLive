import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonalRecords } from '../../types';

@Component({
  selector: 'app-records-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-card card records-board-card">
      <div class="card-header-icon">
        <h3>🏅 Personal records</h3>
      </div>

      <div class="records-list">
        <div class="record-row" *ngIf="records.longestFocusStreak">
          <span class="record-label">Longest streak</span>
          <span class="record-value">{{ records.longestFocusStreak.value }} days</span>
        </div>
        <div class="record-row" *ngIf="records.bestWakeConsistency">
          <span class="record-label">Best wake consistency</span>
          <span class="record-value">{{ records.bestWakeConsistency.value }}%</span>
        </div>
        <div class="record-row" *ngIf="records.lowestImpulseWeek">
          <span class="record-label">Lowest-impulse week</span>
          <span class="record-value">{{ records.lowestImpulseWeek.value }}</span>
        </div>
        <p class="muted-text italic-text" *ngIf="!records.longestFocusStreak && !records.bestWakeConsistency && !records.lowestImpulseWeek">
          Keep going — your first personal records will show up here.
        </p>
      </div>
    </div>

    <div class="record-celebration-backdrop" *ngIf="newlyBroken.length > 0" (click)="dismiss.emit()">
      <div class="record-celebration card" (click)="$event.stopPropagation()">
        <span class="record-celebration-emoji">🎉</span>
        <h4>New personal record{{ newlyBroken.length > 1 ? 's' : '' }}!</h4>
        <ul>
          <li *ngFor="let key of newlyBroken">{{ labelFor(key) }}</li>
        </ul>
        <button class="btn btn-primary" (click)="dismiss.emit()">Nice</button>
      </div>
    </div>
  `
})
export class RecordsBoardComponent {
  @Input() records: PersonalRecords = {};
  @Input() newlyBroken: string[] = [];
  @Output() dismiss = new EventEmitter<void>();

  labelFor(key: string): string {
    return {
      longestFocusStreak: 'Longest streak',
      bestWakeConsistency: 'Best wake consistency',
      lowestImpulseWeek: 'Lowest-impulse week'
    }[key] || key;
  }
}
