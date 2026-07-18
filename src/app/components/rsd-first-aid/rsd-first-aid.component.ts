import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RsdEntry } from '../../types';

@Component({
  selector: 'app-rsd-first-aid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rsd-launcher card" *ngIf="!isOpen">
      <div>
        <h4>💭 RSD first-aid</h4>
        <p class="ritual-hint">A 3-question reframe for when rejection sensitivity is loud.</p>
      </div>
      <button class="btn btn-secondary" (click)="isOpen = true">Start</button>
    </div>

    <div class="rsd-flow card" *ngIf="isOpen">
      <div class="rsd-step">
        <label>1. What happened — just the facts</label>
        <textarea class="form-input notes-textarea" [(ngModel)]="whatHappened" placeholder="No interpretation, just what occurred…"></textarea>
      </div>
      <div class="rsd-step">
        <label>2. The story I'm telling myself</label>
        <textarea class="form-input notes-textarea" [(ngModel)]="storyImTellingMyself" placeholder="What does my mind say this means about me?"></textarea>
      </div>
      <div class="rsd-step">
        <label>3. A kinder, more likely read</label>
        <textarea class="form-input notes-textarea" [(ngModel)]="kinderRead" placeholder="What would I tell a friend in this exact situation?"></textarea>
      </div>
      <div class="rsd-flow-actions">
        <button class="btn btn-secondary" (click)="cancel()">Cancel</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="!whatHappened.trim()">Save privately</button>
      </div>
    </div>

    <div class="rsd-entries" *ngIf="entries.length > 0 && !isOpen">
      <h4>Past reframes</h4>
      <div class="rsd-entry card" *ngFor="let entry of recentEntries">
        <div class="rsd-entry-row"><b>Happened:</b> {{ entry.whatHappened }}</div>
        <div class="rsd-entry-row" *ngIf="entry.storyImTellingMyself"><b>Story:</b> {{ entry.storyImTellingMyself }}</div>
        <div class="rsd-entry-row" *ngIf="entry.kinderRead"><b>Kinder read:</b> {{ entry.kinderRead }}</div>
        <button class="btn btn-secondary btn-icon btn-sm-square rsd-delete-btn" (click)="deleteEntry.emit(entry.id)" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </button>
      </div>
    </div>
  `
})
export class RsdFirstAidComponent {
  @Input() entries: RsdEntry[] = [];
  @Output() saveEntry = new EventEmitter<{ whatHappened: string; storyImTellingMyself: string; kinderRead: string }>();
  @Output() deleteEntry = new EventEmitter<string>();

  isOpen = false;
  whatHappened = '';
  storyImTellingMyself = '';
  kinderRead = '';

  get recentEntries(): RsdEntry[] {
    return [...this.entries].reverse().slice(0, 10);
  }

  save(): void {
    if (!this.whatHappened.trim()) return;
    this.saveEntry.emit({
      whatHappened: this.whatHappened.trim(),
      storyImTellingMyself: this.storyImTellingMyself.trim(),
      kinderRead: this.kinderRead.trim()
    });
    this.reset();
  }

  cancel(): void {
    this.reset();
  }

  private reset(): void {
    this.isOpen = false;
    this.whatHappened = '';
    this.storyImTellingMyself = '';
    this.kinderRead = '';
  }
}
