import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'kb-evidence',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="kb-evidence">
      {{ label }}
      <span class="kb-evidence-dots">
        <i *ngFor="let d of dotsArray; let i = index" [class.on]="i < filled"></i>
      </span>
    </span>
  `,
  styles: [`
    .kb-evidence {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-sans);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .03em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .kb-evidence-dots { display: inline-flex; gap: 3px; }
    .kb-evidence-dots i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--line);
      display: inline-block;
    }
    .kb-evidence-dots i.on { background: var(--good); }
  `]
})
export class EvidenceDotsComponent {
  @Input() label = 'Evidence';
  /** Filled dots out of 3, e.g. 2 = strong, 1 = moderate, 0 = emerging */
  @Input() filled = 0;

  get dotsArray(): number[] {
    return [0, 1, 2];
  }
}
