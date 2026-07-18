import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MoodEnergyCheckIn } from '../../types';

const MAX_CHECKINS_PER_DAY = 3;

// Step 37 requires a 1-5 stored scale and a 2-tap flow; step 49's ADHD-UX
// audit flagged the original flat row of 5 equal-weight buttons as a
// "choose 1 of 5" decision point — a real >3-choices violation. Fixed by
// grouping into 3 tappable choices (Low/OK/Good) that still write a full
// 1-5 value to the data model (2, 3, 4 respectively) — same 2-tap flow
// (one tap for mood, one for energy), same stored scale, just presented
// as a 3-choice decision instead of a 5-choice one.
@Component({
  selector: 'app-mood-checkin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mood-checkin card">
      <h4>💗 Mood + energy check-in</h4>

      <ng-container *ngIf="checkInsToday.length < maxPerDay; else moodMaxedOut">
        <div class="mood-checkin-scale" *ngIf="!selectedMood">
          <span class="mood-checkin-label">Mood</span>
          <div class="mood-checkin-buttons">
            <button *ngFor="let opt of groupedScale" class="mood-checkin-btn mood-checkin-btn-grouped" (click)="selectMood(opt.value)">{{ opt.label }}</button>
          </div>
        </div>

        <div class="mood-checkin-scale" *ngIf="selectedMood && !selectedEnergy">
          <span class="mood-checkin-label">Energy</span>
          <div class="mood-checkin-buttons">
            <button *ngFor="let opt of groupedScale" class="mood-checkin-btn mood-checkin-btn-grouped" (click)="selectEnergy(opt.value)">{{ opt.label }}</button>
          </div>
        </div>
      </ng-container>
      <ng-template #moodMaxedOut>
        <p class="ritual-hint">Checked in {{ maxPerDay }} times today — that's plenty.</p>
      </ng-template>

      <p class="mood-checkin-count">{{ checkInsToday.length }}/{{ maxPerDay }} today</p>
    </div>
  `
})
export class MoodCheckinComponent {
  @Input() checkInsToday: MoodEnergyCheckIn[] = [];
  @Output() checkIn = new EventEmitter<{ mood: number; energy: number }>();

  maxPerDay = MAX_CHECKINS_PER_DAY;
  // 3 grouped choices, each mapping to a representative point on the
  // required 1-5 stored scale (low end, midpoint, high end).
  groupedScale = [
    { label: 'Low', value: 1 },
    { label: 'OK', value: 3 },
    { label: 'Good', value: 5 }
  ];
  selectedMood: number | null = null;
  selectedEnergy: number | null = null;

  selectMood(n: number): void {
    this.selectedMood = n;
  }

  selectEnergy(n: number): void {
    this.selectedEnergy = n;
    if (this.selectedMood !== null) {
      this.checkIn.emit({ mood: this.selectedMood, energy: n });
      this.selectedMood = null;
      this.selectedEnergy = null;
    }
  }
}
