import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlannedBlock } from '../../types';

const MAX_BLOCKS = 3;

@Component({
  selector: 'app-planner-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="planner-panel card">
      <h4>Now + Next <span class="planner-count">{{ blocks.length }}/{{ maxBlocks }}</span></h4>
      <p class="planner-hint">"At ⟨time⟩ I will ⟨action⟩ at ⟨place⟩" — plan-ahead beats willpower.</p>

      <div class="planner-blocks">
        <div *ngFor="let block of blocks" class="planner-block" [class.done]="block.done">
          <button class="planner-check" (click)="toggleDone(block)" [attr.aria-label]="block.done ? 'Mark undone' : 'Mark done'">
            <svg *ngIf="block.done" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
          <div class="planner-block-text">
            <span class="planner-time">{{ block.time }}</span>
            <span class="planner-action">I will {{ block.action }}<ng-container *ngIf="block.place"> at {{ block.place }}</ng-container></span>
          </div>
          <button class="btn btn-secondary btn-icon btn-sm-square" (click)="remove(block.id)" title="Remove">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div *ngIf="blocks.length === 0" class="planner-empty">No blocks planned yet. Add your first one below.</div>
      </div>

      <form *ngIf="blocks.length < maxBlocks" class="planner-form" (ngSubmit)="add()">
        <input class="form-input planner-input-time" type="time" [(ngModel)]="draftTime" name="draftTime" required />
        <input class="form-input planner-input-action" type="text" placeholder="I will…" [(ngModel)]="draftAction" name="draftAction" required maxlength="80" />
        <input class="form-input planner-input-place" type="text" placeholder="at… (optional)" [(ngModel)]="draftPlace" name="draftPlace" maxlength="40" />
        <button class="btn btn-primary" type="submit">Add</button>
      </form>
    </div>
  `
})
export class PlannerPanelComponent {
  @Input() blocks: PlannedBlock[] = [];
  @Output() blocksChange = new EventEmitter<PlannedBlock[]>();

  maxBlocks = MAX_BLOCKS;
  draftTime = '';
  draftAction = '';
  draftPlace = '';

  add(): void {
    if (this.blocks.length >= this.maxBlocks) return;
    if (!this.draftTime || !this.draftAction.trim()) return;

    const newBlock: PlannedBlock = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      time: this.draftTime,
      action: this.draftAction.trim(),
      place: this.draftPlace.trim(),
      done: false
    };

    const next = [...this.blocks, newBlock].sort((a, b) => a.time.localeCompare(b.time));
    this.blocksChange.emit(next);

    this.draftTime = '';
    this.draftAction = '';
    this.draftPlace = '';
  }

  toggleDone(block: PlannedBlock): void {
    const next = this.blocks.map(b => b.id === block.id ? { ...b, done: !b.done } : b);
    this.blocksChange.emit(next);
  }

  remove(id: string): void {
    const next = this.blocks.filter(b => b.id !== id);
    this.blocksChange.emit(next);
  }
}
