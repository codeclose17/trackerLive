import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MoodEnergyCheckIn } from '../../types';

const MAX_CHECKINS_PER_DAY = 3;

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
            <button *ngFor="let n of scale" class="mood-checkin-btn" (click)="selectMood(n)">{{ n }}</button>
          </div>
        </div>

        <div class="mood-checkin-scale" *ngIf="selectedMood && !selectedEnergy">
          <span class="mood-checkin-label">Energy</span>
          <div class="mood-checkin-buttons">
            <button *ngFor="let n of scale" class="mood-checkin-btn" (click)="selectEnergy(n)">{{ n }}</button>
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
  scale = [1, 2, 3, 4, 5];
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
