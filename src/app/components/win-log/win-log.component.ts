import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WinLogEntry } from '../../types';

@Component({
  selector: 'app-win-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="win-log card">
      <h4>🏆 Wins</h4>
      <p class="ritual-hint">Auto-logged when you finish a block or ritual. Add your own too — nothing is too small.</p>

      <form class="win-log-form" (ngSubmit)="add()">
        <input class="form-input" type="text" placeholder="Add a win…" [(ngModel)]="draft" name="draft" maxlength="120" />
        <button class="btn btn-secondary" type="submit" [disabled]="!draft.trim()">Add</button>
      </form>

      <div class="win-log-list">
        <div class="win-log-item" *ngFor="let win of recentWins">
          <span class="win-log-source" [ngClass]="win.source">{{ sourceIcon(win.source) }}</span>
          <span class="win-log-text">{{ win.text }}</span>
        </div>
        <div class="win-log-empty" *ngIf="wins.length === 0">No wins logged yet — they'll show up here as you go.</div>
      </div>
    </div>
  `
})
export class WinLogComponent {
  @Input() wins: WinLogEntry[] = [];
  @Output() addWin = new EventEmitter<string>();

  draft = '';

  get recentWins(): WinLogEntry[] {
    return [...this.wins].reverse().slice(0, 20);
  }

  sourceIcon(source: WinLogEntry['source']): string {
    return { block: '⏱', ritual: '✨', manual: '✍️', 'instant-win': '⚡' }[source];
  }

  add(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.addWin.emit(text);
    this.draft = '';
  }
}
