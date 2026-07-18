import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sleep-anchor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sleep-anchor card">
      <h4>⏰ Sleep anchor</h4>
      <p class="ritual-hint">A fixed wake time — not bedtime — is what actually resets the body clock.</p>

      <div class="sleep-anchor-row">
        <label>
          Wake-time target
          <input type="time" [ngModel]="wakeTimeTarget" (ngModelChange)="wakeTimeTargetChange.emit($event)" />
        </label>
        <span class="sleep-anchor-derived">
          Wind-down alarm: <b>{{ windDownTime }}</b>
        </span>
      </div>
    </div>
  `
})
export class SleepAnchorComponent {
  @Input() wakeTimeTarget = '07:00';
  @Output() wakeTimeTargetChange = new EventEmitter<string>();

  // Wind-down alarm derived from the wake target: 8 hours before, so a
  // consistent wake time also scaffolds a consistent bedtime without the
  // user tracking two separate numbers.
  get windDownTime(): string {
    const [h, m] = this.wakeTimeTarget.split(':').map(Number);
    const totalMinutes = ((h * 60 + m) - 8 * 60 + 24 * 60) % (24 * 60);
    const windDownH = Math.floor(totalMinutes / 60);
    const windDownM = totalMinutes % 60;
    return `${windDownH.toString().padStart(2, '0')}:${windDownM.toString().padStart(2, '0')}`;
  }
}
