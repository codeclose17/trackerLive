import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface EveningRitualResult {
  reflection1: string;
  reflection2: string;
  tomorrowTime: string;
  tomorrowAction: string;
}

@Component({
  selector: 'app-evening-ritual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ritual-card card">
      <div class="ritual-eyebrow-row">
        <div class="ritual-eyebrow">🌙 Shutdown ritual</div>
        <label class="ritual-hour-picker" title="When this ritual becomes available each day">
          Starts at
          <select [ngModel]="startHour" (ngModelChange)="startHourChange.emit($event)">
            <option *ngFor="let h of hourOptions" [value]="h">{{ h.toString().padStart(2, '0') }}:00</option>
          </select>
        </label>
      </div>
      <h4>Evening wind-down</h4>

      <div class="ritual-step">
        <span class="ritual-step-label">1. One thing that went well today</span>
        <input class="form-input" type="text" [(ngModel)]="reflection1" maxlength="120" placeholder="…" />
      </div>

      <div class="ritual-step">
        <span class="ritual-step-label">2. One thing to let go of before bed</span>
        <input class="form-input" type="text" [(ngModel)]="reflection2" maxlength="120" placeholder="…" />
      </div>

      <div class="ritual-step">
        <span class="ritual-step-label">3. Pre-decide tomorrow's first block</span>
        <div class="ritual-inline-fields">
          <input class="form-input planner-input-time" type="time" [(ngModel)]="tomorrowTime" />
          <input class="form-input" type="text" [(ngModel)]="tomorrowAction" maxlength="80" placeholder="I will…" />
        </div>
      </div>

      <div class="ritual-actions">
        <button class="btn btn-secondary" (click)="skip.emit()">Skip for tonight</button>
        <button class="btn btn-primary" (click)="complete()">Done — wind down</button>
      </div>
    </div>
  `
})
export class EveningRitualComponent {
  @Input() startHour = 20;
  @Output() startHourChange = new EventEmitter<number>();

  @Output() done = new EventEmitter<EveningRitualResult>();
  @Output() skip = new EventEmitter<void>();

  hourOptions = Array.from({ length: 24 }, (_, i) => i);

  reflection1 = '';
  reflection2 = '';
  tomorrowTime = '';
  tomorrowAction = '';

  complete(): void {
    this.done.emit({
      reflection1: this.reflection1.trim(),
      reflection2: this.reflection2.trim(),
      tomorrowTime: this.tomorrowTime,
      tomorrowAction: this.tomorrowAction.trim()
    });
  }
}
