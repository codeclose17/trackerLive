import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MorningRitualResult {
  sleepConfirmed: boolean;
  priority: string;
}

@Component({
  selector: 'app-morning-ritual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ritual-card card">
      <div class="ritual-eyebrow">⚡ 3 taps, under 30 seconds</div>
      <h4>Morning launch</h4>

      <div class="ritual-step">
        <span class="ritual-step-label">1. Sleep</span>
        <button
          class="ritual-toggle"
          [class.on]="sleepConfirmed"
          (click)="sleepConfirmed = !sleepConfirmed"
        >
          {{ sleepConfirmed ? '✓ Slept OK' : 'Confirm you slept' }}
        </button>
      </div>

      <div class="ritual-step">
        <span class="ritual-step-label">2. Today wins if…</span>
        <input
          class="form-input"
          type="text"
          placeholder="…I finish one thing that matters"
          [(ngModel)]="priority"
          maxlength="80"
        />
      </div>

      <div class="ritual-step">
        <span class="ritual-step-label">3. First block</span>
        <p class="ritual-hint">Scheduled below in Now + Next.</p>
      </div>

      <div class="ritual-actions">
        <button class="btn btn-secondary" (click)="skip.emit()">Skip for today</button>
        <button class="btn btn-primary" (click)="complete()">Start the day</button>
      </div>
    </div>
  `
})
export class MorningRitualComponent implements OnInit {
  @Input() initialPriority = '';
  @Output() done = new EventEmitter<MorningRitualResult>();
  @Output() skip = new EventEmitter<void>();

  sleepConfirmed = false;
  priority = '';

  ngOnInit(): void {
    this.priority = this.initialPriority;
  }

  complete(): void {
    this.done.emit({ sleepConfirmed: this.sleepConfirmed, priority: this.priority.trim() });
  }
}
