import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'kb-cheat',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kb-cheat">
      <div class="kb-cheat-head">
        <span class="kb-cheat-combo" *ngIf="combo">{{ combo }}</span>
        <h4>{{ title }}</h4>
      </div>
      <div class="kb-cheat-body">
        <ng-content></ng-content>
      </div>
      <div class="kb-cheat-mech" *ngIf="mechanism">
        <b>Why it works:</b> {{ mechanism }}
      </div>
    </div>
  `,
  styles: [`
    .kb-cheat {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--border-radius-lg);
      padding: 19px 21px;
      margin: 0;
      box-shadow: var(--shadow-md);
    }
    .kb-cheat-head {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .kb-cheat-combo {
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 600;
      color: var(--ink);
      background: var(--surface-2);
      border: 1px solid var(--line);
      border-bottom-width: 3px;
      border-radius: 7px;
      padding: 5px 10px;
      white-space: nowrap;
    }
    .kb-cheat h4 {
      font-size: 1.12rem;
      margin: 0;
      flex: 1;
      min-width: 140px;
      font-family: var(--font-sans);
      color: var(--ink);
    }
    .kb-cheat-body {
      margin-top: 11px;
      font-size: .95rem;
      color: var(--ink-soft);
      font-family: var(--serif);
    }
    .kb-cheat-mech {
      font-family: var(--mono);
      font-size: .78rem;
      color: var(--cool);
      background: color-mix(in srgb, var(--cool) 8%, transparent);
      border-radius: 7px;
      padding: 8px 11px;
      margin-top: 10px;
      border: 1px solid color-mix(in srgb, var(--cool) 22%, var(--line));
      line-height: 1.5;
    }
    .kb-cheat-mech b { color: var(--cool); }
  `]
})
export class CheatCardComponent {
  @Input() combo = '';
  @Input() title = '';
  @Input() mechanism = '';
}
