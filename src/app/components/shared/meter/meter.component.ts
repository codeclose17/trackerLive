import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'kb-meter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kb-meter">
      <div class="kb-meter-row">
        <span class="kb-meter-name">{{ name }}</span>
        <span class="kb-meter-val">{{ valueLabel }}</span>
      </div>
      <div class="kb-meter-bar">
        <div class="kb-meter-fill" [style.width.%]="clampedPercent"></div>
      </div>
    </div>
  `,
  styles: [`
    .kb-meter { margin: 0; }
    .kb-meter-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-family: var(--font-sans);
    }
    .kb-meter-name { font-weight: 600; font-size: .94rem; color: var(--ink); }
    .kb-meter-val { font-family: var(--mono); font-size: 12px; color: var(--muted); }
    .kb-meter-bar {
      height: 9px;
      border-radius: 999px;
      background: var(--surface-2);
      margin-top: 6px;
      overflow: hidden;
      border: 1px solid var(--line);
    }
    .kb-meter-fill {
      height: 100%;
      border-radius: 999px;
      background: var(--grad-hot);
      transition: width 1.1s cubic-bezier(.2,.8,.2,1);
    }
    @media (prefers-reduced-motion: reduce) {
      .kb-meter-fill { transition: none; }
    }
  `]
})
export class MeterComponent {
  @Input() name = '';
  @Input() valueLabel = '';
  @Input() percent = 0;

  get clampedPercent(): number {
    return Math.max(0, Math.min(100, this.percent));
  }
}
