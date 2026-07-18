import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CaffeineEntry, DayRecord, MovementEntry } from '../../types';

const SIGH_DURATION_SEC = 60;

@Component({
  selector: 'app-body-regulators',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="body-regulators">
      <!-- STEP 29: morning sunlight chip (only before noon) -->
      <div class="regulator-card card" *ngIf="isBeforeNoon">
        <button
          class="regulator-chip"
          [class.done]="record?.morningLightDone"
          (click)="toggleMorningLight()"
        >
          ☀ {{ record?.morningLightDone ? 'Morning light ✓' : 'Got morning light?' }}
        </button>
        <p class="regulator-micro">10 min of outdoor light before 9am advances your body clock and pulses cortisol at the right time. <button class="regulator-kb-link" (click)="openKb.emit('cheatcodes')">Why this works →</button> <span class="regulator-streak" *ngIf="morningLightStreak > 0">🔥 {{ morningLightStreak }}-day streak</span></p>
      </div>

      <!-- STEP 31: protein breakfast chip (mornings only, no calories) -->
      <div class="regulator-card card" *ngIf="isBeforeNoon">
        <button
          class="regulator-chip"
          [class.done]="record?.proteinBreakfastDone"
          (click)="toggleProteinBreakfast()"
        >
          🍳 {{ record?.proteinBreakfastDone ? 'Protein breakfast ✓' : 'Protein breakfast?' }}
        </button>
        <p class="regulator-micro">Protein stabilizes blood sugar so a crash doesn't mimic — and worsen — inattention later.</p>
      </div>

      <!-- STEP 30: movement log -->
      <div class="regulator-card card">
        <h4>🏃 Movement</h4>
        <form class="regulator-form" (ngSubmit)="logMovement()">
          <input class="form-input" type="text" placeholder="Type (walk, farm work…)" [(ngModel)]="movementType" name="movementType" maxlength="40" />
          <input class="form-input regulator-minutes-input" type="number" min="1" max="300" placeholder="min" [(ngModel)]="movementMinutes" name="movementMinutes" />
          <button class="btn btn-secondary" type="submit" [disabled]="!movementType.trim() || !movementMinutes">Log</button>
        </form>
        <div class="focus-window-hint" *ngIf="activeFocusWindow">
          ⚡ Focus window open — post-movement catecholamines are elevated for ~90 min (until {{ activeFocusWindow }}).
        </div>
      </div>

      <!-- STEP 32: caffeine helper -->
      <div class="regulator-card card">
        <h4>☕ Caffeine</h4>
        <button class="btn btn-secondary" (click)="logCaffeine()">Log a caffeine drink</button>
        <div class="caffeine-warning" *ngIf="isPastCutoff">
          ⚠ That's past your {{ cutoffTime }} cutoff — caffeine's ~5-6h half-life means this dose is still partly active at bedtime, working against your wind-down.
        </div>
      </div>

      <!-- STEP 33: stress reset -->
      <div class="regulator-card card">
        <h4>🫁 Stress reset</h4>
        <button class="btn btn-secondary" (click)="startSigh()" *ngIf="!sighActive">Guided physiological sigh (60s)</button>
        <div class="sigh-guide" *ngIf="sighActive">
          <div class="sigh-circle" [class.exhale]="sighPhase === 'exhale'">{{ sighPhase === 'inhale' ? 'Breathe in (double)' : 'Long exhale' }}</div>
          <span class="sigh-timer">{{ sighRemaining }}s</span>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="logColdExposure()" [class.done]="record?.coldExposureDone">
          ❄ {{ record?.coldExposureDone ? 'Cold exposure ✓' : 'Log cold exposure' }}
        </button>
      </div>
    </div>
  `
})
export class BodyRegulatorsComponent implements OnDestroy {
  @Input() record: DayRecord | null = null;
  @Input() morningLightStreak = 0;
  @Input() caffeineCutoffHour = 14;

  @Output() toggleMorningLightDone = new EventEmitter<void>();
  @Output() toggleProteinBreakfastDone = new EventEmitter<void>();
  @Output() addMovement = new EventEmitter<{ type: string; minutes: number }>();
  @Output() addCaffeine = new EventEmitter<void>();
  @Output() incrementStressReset = new EventEmitter<void>();
  @Output() toggleColdExposureDone = new EventEmitter<void>();
  @Output() openKb = new EventEmitter<string>();

  movementType = '';
  movementMinutes: number | null = null;

  sighActive = false;
  sighPhase: 'inhale' | 'exhale' = 'inhale';
  sighRemaining = SIGH_DURATION_SEC;
  private sighTimer?: ReturnType<typeof setInterval>;

  get isBeforeNoon(): boolean {
    return new Date().getHours() < 12;
  }

  get cutoffTime(): string {
    return `${this.caffeineCutoffHour.toString().padStart(2, '0')}:00`;
  }

  get isPastCutoff(): boolean {
    return new Date().getHours() >= this.caffeineCutoffHour;
  }

  get activeFocusWindow(): string | null {
    const log = this.record?.movementLog || [];
    if (log.length === 0) return null;
    const latest = log[log.length - 1];
    const loggedAt = new Date(latest.loggedAt);
    const windowEnd = new Date(loggedAt.getTime() + 90 * 60000);
    if (Date.now() > windowEnd.getTime()) return null;
    return windowEnd.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  toggleMorningLight(): void {
    this.toggleMorningLightDone.emit();
  }

  toggleProteinBreakfast(): void {
    this.toggleProteinBreakfastDone.emit();
  }

  logMovement(): void {
    if (!this.movementType.trim() || !this.movementMinutes) return;
    this.addMovement.emit({ type: this.movementType.trim(), minutes: this.movementMinutes });
    this.movementType = '';
    this.movementMinutes = null;
  }

  logCaffeine(): void {
    this.addCaffeine.emit();
  }

  startSigh(): void {
    this.sighActive = true;
    this.sighPhase = 'inhale';
    this.sighRemaining = SIGH_DURATION_SEC;
    this.sighTimer = setInterval(() => {
      this.sighRemaining--;
      // Simple double-inhale / long-exhale cadence: 4s in, 6s out, repeating.
      const cyclePos = (SIGH_DURATION_SEC - this.sighRemaining) % 10;
      this.sighPhase = cyclePos < 4 ? 'inhale' : 'exhale';
      if (this.sighRemaining <= 0) {
        this.finishSigh();
      }
    }, 1000);
  }

  private finishSigh(): void {
    if (this.sighTimer) clearInterval(this.sighTimer);
    this.sighActive = false;
    this.incrementStressReset.emit();
  }

  logColdExposure(): void {
    this.toggleColdExposureDone.emit();
  }

  ngOnDestroy(): void {
    if (this.sighTimer) clearInterval(this.sighTimer);
  }
}
