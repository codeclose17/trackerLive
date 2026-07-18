import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inbox-fab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button class="inbox-fab" (click)="open()" title="Brain-dump — capture a thought" aria-label="Capture a thought">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    </button>

    <div class="inbox-fab-backdrop" *ngIf="isOpen" (click)="close()">
      <div class="inbox-fab-sheet card" (click)="$event.stopPropagation()">
        <h4>Brain-dump</h4>
        <p class="inbox-fab-hint">Get it out of your head. No fields required — just capture it.</p>
        <form (ngSubmit)="save()">
          <textarea
            #captureInput
            class="form-input inbox-fab-textarea"
            placeholder="What's on your mind?"
            [(ngModel)]="draft"
            name="draft"
            autofocus
          ></textarea>
          <div class="inbox-fab-actions">
            <button type="button" class="btn btn-secondary" (click)="close()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!draft.trim()">Capture</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class InboxFabComponent {
  @Output() capture = new EventEmitter<string>();

  isOpen = false;
  draft = '';

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
    this.draft = '';
  }

  save(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.capture.emit(text);
    this.close();
  }
}
