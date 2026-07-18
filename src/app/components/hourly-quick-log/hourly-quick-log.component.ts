import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../types';

@Component({
  selector: 'app-hourly-quick-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quick-log-banner card" *ngIf="visible">
      <div class="quick-log-head">
        <span class="quick-log-eyebrow">Quick log</span>
        <button class="quick-log-dismiss" (click)="dismiss.emit()" aria-label="Dismiss">✕</button>
      </div>
      <p class="quick-log-question">What was <b>{{ hourLabel }}</b>?</p>
      <div class="quick-log-chips">
        <button
          *ngFor="let cat of categories"
          class="quick-log-chip"
          [style.borderColor]="cat.color"
          (click)="pick(cat.id)"
        >
          <span class="dot" [style.backgroundColor]="cat.color"></span>
          {{ cat.id === 'idle' ? 'Idle' : cat.name }}
        </button>
      </div>
    </div>
  `
})
export class HourlyQuickLogComponent implements OnChanges {
  @Input() hourIndex: number | null = null;
  @Input() categories: Category[] = [];

  @Output() logHour = new EventEmitter<{ hourIndex: number; categoryId: string }>();
  @Output() dismiss = new EventEmitter<void>();

  visible = false;
  hourLabel = '';

  ngOnChanges(): void {
    this.visible = this.hourIndex !== null;
    if (this.hourIndex !== null) {
      const start = this.hourIndex.toString().padStart(2, '0');
      const end = ((this.hourIndex + 1) % 24).toString().padStart(2, '0');
      this.hourLabel = `${start}:00–${end}:00`;
    }
  }

  pick(categoryId: string): void {
    if (this.hourIndex === null) return;
    this.logHour.emit({ hourIndex: this.hourIndex, categoryId });
  }
}
