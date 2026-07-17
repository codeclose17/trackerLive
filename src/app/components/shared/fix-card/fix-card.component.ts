import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FixItem {
  text: string;
  evidenceDots?: number; // 0-3
}

@Component({
  selector: 'kb-fix',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kb-fix">
      <div class="kb-fix-problem">
        <div class="kb-fix-lbl kb-fix-lbl-bad">{{ problemLabel }}</div>
        <h4>{{ problem }}</h4>
      </div>
      <div class="kb-fix-why" *ngIf="why"><b>Why:</b> {{ why }}</div>
      <div class="kb-fix-fixes">
        <span class="kb-fix-lbl kb-fix-lbl-good">Fixes</span>
        <ul>
          <li *ngFor="let fix of fixes">
            <span class="tick">✓</span>
            <span>{{ fix }}</span>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .kb-fix {
      border: 1px solid var(--line);
      border-radius: var(--border-radius-lg);
      background: var(--surface);
      overflow: hidden;
      margin: 0;
      box-shadow: var(--shadow-md);
    }
    .kb-fix-problem {
      padding: 14px 18px 13px;
      background: color-mix(in srgb, var(--bad) 9%, var(--surface));
      border-bottom: 1px solid var(--line);
    }
    .kb-fix-lbl {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: .14em;
      text-transform: uppercase;
      font-weight: 600;
    }
    .kb-fix-lbl-bad { color: var(--bad); }
    .kb-fix-lbl-good { color: var(--good); margin-bottom: 9px; display: block; }
    .kb-fix-problem h4 {
      font-size: 1.1rem;
      margin: 5px 0 0;
      font-family: var(--font-sans);
      color: var(--ink);
    }
    .kb-fix-why {
      padding: 12px 18px;
      font-size: .88rem;
      color: var(--muted);
      border-bottom: 1px dashed var(--line);
      font-family: var(--font-sans);
      line-height: 1.5;
    }
    .kb-fix-why b { color: var(--hot-3); font-weight: 700; }
    .kb-fix-fixes { padding: 13px 18px 16px; }
    .kb-fix-fixes ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 11px;
    }
    .kb-fix-fixes li {
      display: flex;
      gap: 11px;
      align-items: flex-start;
      font-size: .93rem;
      color: var(--ink-soft);
      line-height: 1.5;
      font-family: var(--serif);
    }
    .kb-fix-fixes li .tick {
      color: var(--good);
      font-weight: 700;
      flex: none;
      font-family: var(--mono);
      font-size: .85rem;
      margin-top: 2px;
    }
  `]
})
export class FixCardComponent {
  @Input() problemLabel = 'The negative';
  @Input() problem = '';
  @Input() why = '';
  @Input() fixes: string[] = [];
}
