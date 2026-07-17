import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'kb-eyebrow',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="kb-eyebrow"><ng-content>{{ text }}</ng-content></span>`,
  styles: [`
    .kb-eyebrow {
      font-family: var(--mono);
      font-size: 12px;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: var(--hot-3);
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .kb-eyebrow::before {
      content: "";
      width: 26px;
      height: 2px;
      background: var(--grad-hot);
      border-radius: 2px;
      flex: none;
    }
  `]
})
export class EyebrowComponent {
  @Input() text = '';
}
