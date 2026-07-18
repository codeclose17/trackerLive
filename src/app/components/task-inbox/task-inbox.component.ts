import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnergyLevel, Task } from '../../types';

@Component({
  selector: 'app-task-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="task-inbox">
      <div class="task-inbox-header">
        <span class="today-eyebrow">Tasks</span>
        <h2>Inbox &amp; shredder</h2>
        <p class="subtitle">Capture anywhere with the + button. Shred each task into a first physical step (≤10 min) — only then can it be scheduled onto Today.</p>
      </div>

      <!-- STEP 19: energy self-rating filters the list below -->
      <div class="energy-filter-row">
        <span class="energy-filter-label">My energy right now:</span>
        <button
          *ngFor="let level of energyLevels"
          class="task-tag"
          [class.active]="currentEnergyFilter === level"
          (click)="setEnergyFilter(level)"
        >{{ energyLabel(level) }}</button>
        <button class="task-tag" [class.active]="currentEnergyFilter === null" (click)="setEnergyFilter(null)">Show all</button>
      </div>

      <div class="task-list">
        <div *ngFor="let task of visibleTasks" class="task-card card" [class.done]="task.done">
          <div class="task-card-top">
            <button class="planner-check" (click)="toggleDone(task)" [attr.aria-label]="task.done ? 'Mark undone' : 'Mark done'">
              <svg *ngIf="task.done" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </button>
            <span class="task-text">{{ task.text }}</span>
            <button class="btn btn-secondary btn-icon btn-sm-square" (click)="remove(task.id)" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            </button>
          </div>

          <!-- STEP 16: task shredder — no first action, no scheduling -->
          <div class="task-shred-row" *ngIf="!task.firstAction && !task.done">
            <span class="kb-fix-lbl kb-fix-lbl-bad">Needs shredding</span>
            <div class="task-shred-form">
              <input
                class="form-input"
                type="text"
                placeholder="First physical action (<=10 min)…"
                [(ngModel)]="shredDrafts[task.id]"
                (keydown.enter)="shred(task)"
                maxlength="100"
              />
              <button class="btn btn-secondary btn-sm" (click)="shred(task)" [disabled]="!(shredDrafts[task.id] || '').trim()">Set</button>
            </div>
          </div>

          <div class="task-meta-row" *ngIf="task.firstAction">
            <span class="task-first-action">→ {{ task.firstAction }}</span>
            <button
              *ngIf="!task.done"
              class="btn btn-secondary btn-sm"
              (click)="scheduleTask.emit(task)"
              title="Add the first action as a Now+Next block on Today"
            >Schedule</button>
          </div>

          <div class="task-tags-row">
            <!-- STEP 17: 2-minute lane -->
            <button
              class="task-tag"
              [class.active]="task.isTwoMinuteTask"
              (click)="toggleTwoMinute(task)"
              title="Flag as a 2-minute task — shows as an instant-win chip on Today"
            >⚡ 2-min</button>

            <!-- STEP 19: energy matching -->
            <button
              *ngFor="let level of energyLevels"
              class="task-tag"
              [class.active]="task.energy === level"
              (click)="setEnergy(task, level)"
            >{{ energyLabel(level) }}</button>

            <!-- STEP 21: deadline scaffolding -->
            <label class="task-due-picker">
              Due
              <input type="date" [ngModel]="task.dueDate" (ngModelChange)="setDueDate(task, $event)" />
            </label>
          </div>

          <div class="task-milestones" *ngIf="getMilestones(task.id).length > 0">
            <span class="task-milestones-label">Backwards milestones</span>
            <div class="task-milestone-chip" *ngFor="let m of getMilestones(task.id)">
              {{ m.dueDate }} — {{ m.text }}
            </div>
          </div>
        </div>

        <div *ngIf="tasks.length === 0" class="task-inbox-empty">
          Nothing here yet. Use the + button on any screen to capture a thought.
        </div>
      </div>
    </div>
  `
})
export class TaskInboxComponent {
  @Input() tasks: Task[] = [];
  @Output() tasksChange = new EventEmitter<Task[]>();
  /** Emitted only for tasks that already have a firstAction — the shredder
   * gate — so scheduling a task is structurally impossible before that. */
  @Output() scheduleTask = new EventEmitter<Task>();

  energyLevels: EnergyLevel[] = ['low', 'med', 'high'];
  shredDrafts: Record<string, string> = {};

  /** Step 19: current self-rated energy, used to filter the visible list.
   * null = show everything (default, so the inbox isn't hidden by default). */
  currentEnergyFilter: EnergyLevel | null = null;

  energyLabel(level: EnergyLevel): string {
    return { low: '🔋 Low', med: '🔋🔋 Med', high: '🔋🔋🔋 High' }[level];
  }

  setEnergyFilter(level: EnergyLevel | null): void {
    this.currentEnergyFilter = level;
  }

  get visibleTasks(): Task[] {
    if (this.currentEnergyFilter === null) return this.tasks;
    // Low energy -> only show low-energy tasks (protect against overcommitting).
    // Med energy -> low or med. High energy -> everything, since a
    // high-energy moment can also absorb an easy task.
    const order: EnergyLevel[] = ['low', 'med', 'high'];
    const maxIdx = order.indexOf(this.currentEnergyFilter);
    return this.tasks.filter(t => !t.energy || order.indexOf(t.energy) <= maxIdx);
  }

  getMilestones(parentId: string): Task[] {
    return this.tasks.filter(t => t.isMilestone && t.parentTaskId === parentId);
  }

  private update(id: string, patch: Partial<Task>): void {
    const next = this.tasks.map(t => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t);
    this.tasksChange.emit(next);
  }

  toggleDone(task: Task): void {
    this.update(task.id, { done: !task.done, doneAt: !task.done ? new Date().toISOString() : undefined });
  }

  remove(id: string): void {
    this.tasksChange.emit(this.tasks.filter(t => t.id !== id && t.parentTaskId !== id));
  }

  shred(task: Task): void {
    const action = (this.shredDrafts[task.id] || '').trim();
    if (!action) return;
    this.update(task.id, { firstAction: action });
    delete this.shredDrafts[task.id];
  }

  toggleTwoMinute(task: Task): void {
    this.update(task.id, { isTwoMinuteTask: !task.isTwoMinuteTask });
  }

  setEnergy(task: Task, level: EnergyLevel): void {
    this.update(task.id, { energy: task.energy === level ? undefined : level });
  }

  setDueDate(task: Task, dueDate: string): void {
    if (!dueDate) {
      this.update(task.id, { dueDate: undefined });
      return;
    }

    const alreadyHasMilestones = this.getMilestones(task.id).length > 0;
    this.update(task.id, { dueDate });

    if (!alreadyHasMilestones) {
      const due = new Date(dueDate);
      const halfway = new Date(due);
      halfway.setDate(due.getDate() - Math.max(1, Math.floor((due.getTime() - Date.now()) / (2 * 86400000))));
      const dayBefore = new Date(due);
      dayBefore.setDate(due.getDate() - 1);

      const toLocalDate = (d: Date) => {
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const milestones: Task[] = [
        {
          id: `${Date.now()}-m1-${Math.random().toString(36).slice(2, 6)}`,
          text: `Halfway checkpoint: ${task.text}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          done: false,
          isMilestone: true,
          parentTaskId: task.id,
          dueDate: toLocalDate(halfway)
        },
        {
          id: `${Date.now()}-m2-${Math.random().toString(36).slice(2, 6)}`,
          text: `Final check before due: ${task.text}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          done: false,
          isMilestone: true,
          parentTaskId: task.id,
          dueDate: toLocalDate(dayBefore)
        }
      ];

      this.tasksChange.emit([...this.tasks.map(t => t.id === task.id ? { ...t, dueDate } : t), ...milestones]);
    }
  }
}
