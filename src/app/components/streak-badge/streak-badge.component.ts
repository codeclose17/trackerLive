import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-streak-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="streak-badge" [class.dimmed]="isDimmedByOneMiss" [title]="streakDays + ' day streak' + (isDimmedByOneMiss ? ' — one day missed, still counting' : '')">
      <span class="streak-flame">🔥</span>
      <span class="streak-count">{{ streakDays }}</span>
    </div>
    <div class="never-miss-nudge" *ngIf="isDimmedByOneMiss">
      Missed a day — that's OK. The rule is <b>never miss twice</b>.
    </div>
  `
})
export class StreakBadgeComponent {
  @Input() streakDays = 0;
  @Input() isDimmedByOneMiss = false;
}
