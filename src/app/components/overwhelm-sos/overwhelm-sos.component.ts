import { Component, Input, Output, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-overwhelm-sos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="sos-launcher" (click)="open.emit()" title="Overwhelmed? Collapse to one thing.">
      🆘 SOS
    </button>

    <div class="sos-fullscreen" *ngIf="isOpen">
      <button class="sos-exit" (click)="exit.emit()" aria-label="Return to normal view">✕ Back to normal</button>

      <div class="sos-content">
        <span class="sos-eyebrow">One thing. That's all.</span>

        <div class="sos-next-action" *ngIf="smallestNextAction; else sosNoAction">
          <p>{{ smallestNextAction }}</p>
        </div>
        <ng-template #sosNoAction>
          <div class="sos-next-action sos-next-action-empty">
            <p>Nothing queued — just breathe for a moment. That's enough right now.</p>
          </div>
        </ng-template>

        <div class="sos-breathing-guide">
          <div class="sos-breath-circle" [class.exhale]="breathPhase === 'exhale'">
            {{ breathPhase === 'inhale' ? 'In…' : 'Out…' }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class OverwhelmSosComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() smallestNextAction: string | null = null;

  @Output() open = new EventEmitter<void>();
  @Output() exit = new EventEmitter<void>();

  breathPhase: 'inhale' | 'exhale' = 'inhale';
  private breathTimer?: ReturnType<typeof setInterval>;

  ngOnChanges(): void {
    if (this.isOpen && !this.breathTimer) {
      this.startBreathing();
    } else if (!this.isOpen && this.breathTimer) {
      this.stopBreathing();
    }
  }

  private startBreathing(): void {
    this.breathPhase = 'inhale';
    let elapsed = 0;
    this.breathTimer = setInterval(() => {
      elapsed += 1;
      const cyclePos = elapsed % 10; // 4s inhale, 6s exhale
      this.breathPhase = cyclePos < 4 ? 'inhale' : 'exhale';
    }, 1000);
  }

  private stopBreathing(): void {
    if (this.breathTimer) {
      clearInterval(this.breathTimer);
      this.breathTimer = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopBreathing();
  }
}
