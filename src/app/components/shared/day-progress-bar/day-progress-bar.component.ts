import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

const WAKE_HOUR = 6;   // 06:00 — start of the tracked waking day
const SLEEP_HOUR = 23; // 23:00 — end of the tracked waking day

@Component({
  selector: 'app-day-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="day-progress-bar" role="progressbar" [attr.aria-valuenow]="percent"
         aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="'Waking day ' + percent + '% elapsed'">
      <div class="day-progress-fill" [style.width.%]="percent"></div>
    </div>
  `,
  styles: [`
    .day-progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      width: 100%;
      z-index: 90;
      background: transparent;
      pointer-events: none;
    }
    .day-progress-fill {
      height: 100%;
      background: var(--grad-hot);
      box-shadow: 0 0 14px var(--hot-1);
      transition: width 20s linear;
    }
    @media (prefers-reduced-motion: reduce) {
      .day-progress-fill { transition: none; }
    }
  `]
})
export class DayProgressBarComponent implements OnInit, OnDestroy {
  percent = 0;
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.update();
    this.timer = setInterval(() => this.update(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private update(): void {
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const wakeMinutes = WAKE_HOUR * 60;
    const sleepMinutes = SLEEP_HOUR * 60;
    const totalWakingMinutes = sleepMinutes - wakeMinutes;

    const elapsed = minutesNow - wakeMinutes;
    const pct = (elapsed / totalWakingMinutes) * 100;
    this.percent = Math.round(Math.max(0, Math.min(100, pct)));
  }
}
