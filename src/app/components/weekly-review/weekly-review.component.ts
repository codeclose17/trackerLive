import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BestDayAutopsy } from '../../utils/weekly-review';

@Component({
  selector: 'app-weekly-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="weekly-review card">
      <span class="today-eyebrow">Sunday review</span>
      <h4>How this week went</h4>

      <div class="review-autopsy" *ngIf="bestDay; else noAutopsy">
        <p class="review-autopsy-label">Best day autopsy — {{ formattedBestDayDate }}</p>
        <ul class="review-autopsy-reasons">
          <li *ngFor="let reason of bestDay.reasons">{{ reason }}</li>
        </ul>
      </div>
      <ng-template #noAutopsy>
        <p class="ritual-hint">Not enough data yet to autopsy a best day — keep logging and check back next Sunday.</p>
      </ng-template>

      <div class="review-experiment-picker">
        <label>Pick ONE experiment for next week</label>
        <input
          class="form-input"
          type="text"
          placeholder="e.g. wake time at 07:00 every day, no exceptions"
          [(ngModel)]="experimentDraft"
          maxlength="120"
        />
        <button class="btn btn-primary" (click)="save()" [disabled]="!experimentDraft.trim()">Pin this week's experiment</button>
      </div>
    </div>
  `
})
export class WeeklyReviewComponent {
  @Input() bestDay: BestDayAutopsy | null = null;
  @Output() saveExperiment = new EventEmitter<string>();

  experimentDraft = '';

  get formattedBestDayDate(): string {
    if (!this.bestDay) return '';
    return new Date(this.bestDay.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  save(): void {
    const text = this.experimentDraft.trim();
    if (!text) return;
    this.saveExperiment.emit(text);
    this.experimentDraft = '';
  }
}
