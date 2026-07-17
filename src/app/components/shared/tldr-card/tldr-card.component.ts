import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'kb-tldr',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kb-tldr">
      <div class="kb-tldr-tag">⚡ {{ tag }}</div>
      <ul class="kb-tldr-list">
        <li *ngFor="let point of points">{{ point }}</li>
      </ul>
    </div>
  `,
  styles: [`
    .kb-tldr {
      background: color-mix(in srgb, var(--cool) 10%, var(--surface));
      border: 1px solid color-mix(in srgb, var(--cool) 35%, var(--line));
      border-left: 4px solid var(--cool);
      border-radius: var(--border-radius-lg);
      padding: 17px 21px;
      margin: 0;
    }
    .kb-tldr-tag {
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: var(--cool);
      font-weight: 600;
    }
    .kb-tldr-list {
      margin: 9px 0 0;
      padding-left: 20px;
    }
    .kb-tldr-list li {
      margin: 5px 0;
      font-size: .95rem;
      color: var(--ink-soft);
      font-family: var(--font-sans);
    }
    .kb-tldr-list li::marker { color: var(--cool); }
  `]
})
export class TldrCardComponent {
  @Input() tag = '30-second version';
  @Input() points: string[] = [];
}
