import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FrictionCard, ImpulseLogEntry, ImpulseTrigger } from '../../types';

type FlowStep = 'closed' | 'trigger' | 'surfing';

const SURF_SECONDS = 10 * 60;

@Component({
  selector: 'app-impulse-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="impulse-log-launcher card">
      <div>
        <h4>⚠️ Impulse log</h4>
        <p class="ritual-hint">{{ todayCount }} logged today · {{ todaySurfedCount }} surfed</p>
      </div>
      <button class="btn btn-secondary" (click)="startFlow()">Log an urge</button>
    </div>

    <div class="impulse-flow-backdrop" *ngIf="step !== 'closed'" (click)="close()">
      <div class="impulse-flow-sheet card" (click)="$event.stopPropagation()">
        <!-- STEP: pick the trigger -->
        <ng-container *ngIf="step === 'trigger'">
          <h4>What's driving it?</h4>
          <div class="impulse-trigger-grid">
            <button class="task-tag" (click)="pickTrigger('bored')">😑 Bored</button>
            <button class="task-tag" (click)="pickTrigger('anxious')">😰 Anxious</button>
            <button class="task-tag" (click)="pickTrigger('tired')">😴 Tired</button>
            <button class="task-tag" (click)="pickTrigger('phone')">📱 Saw my phone</button>
          </div>
        </ng-container>

        <!-- STEP: friction card + surf timer -->
        <ng-container *ngIf="step === 'surfing'">
          <div class="friction-card" *ngIf="frictionCard?.whyText">
            <span class="friction-card-label">Your reason, in your own words:</span>
            <p class="friction-card-text">"{{ frictionCard!.whyText }}"</p>
          </div>
          <div class="friction-card friction-card-empty" *ngIf="!frictionCard?.whyText">
            <p class="friction-card-text">No reminder written yet — add one in Settings so it shows up here next time.</p>
          </div>

          <div class="surf-timer">
            <span class="surf-timer-label">Surf the urge</span>
            <span class="surf-timer-clock">{{ formattedRemaining }}</span>
          </div>

          <div class="impulse-flow-actions">
            <button class="btn btn-secondary" (click)="surfed()">I surfed it — didn't act</button>
            <button class="btn btn-danger" [disabled]="remainingSec > 0" (click)="acted()">
              Continue anyway{{ remainingSec > 0 ? ' (' + formattedRemaining + ')' : '' }}
            </button>
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class ImpulseLogComponent implements OnDestroy {
  @Input() entriesToday: ImpulseLogEntry[] = [];
  @Input() frictionCard: FrictionCard | null = null;

  @Output() logImpulse = new EventEmitter<{ trigger: ImpulseTrigger; outcome: 'acted' | 'surfed' }>();

  step: FlowStep = 'closed';
  selectedTrigger: ImpulseTrigger | null = null;
  remainingSec = SURF_SECONDS;
  private timer?: ReturnType<typeof setInterval>;

  get todayCount(): number {
    return this.entriesToday.length;
  }

  get todaySurfedCount(): number {
    return this.entriesToday.filter(e => e.outcome === 'surfed').length;
  }

  get formattedRemaining(): string {
    const m = Math.floor(this.remainingSec / 60).toString().padStart(2, '0');
    const s = (this.remainingSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  startFlow(): void {
    this.step = 'trigger';
  }

  pickTrigger(trigger: ImpulseTrigger): void {
    this.selectedTrigger = trigger;
    this.step = 'surfing';
    this.remainingSec = SURF_SECONDS;
    this.timer = setInterval(() => {
      this.remainingSec = Math.max(0, this.remainingSec - 1);
      if (this.remainingSec === 0 && this.timer) {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  surfed(): void {
    if (this.selectedTrigger) {
      this.logImpulse.emit({ trigger: this.selectedTrigger, outcome: 'surfed' });
    }
    this.close();
  }

  acted(): void {
    if (this.remainingSec > 0) return; // countdown gate, enforced here too
    if (this.selectedTrigger) {
      this.logImpulse.emit({ trigger: this.selectedTrigger, outcome: 'acted' });
    }
    this.close();
  }

  close(): void {
    this.step = 'closed';
    this.selectedTrigger = null;
    if (this.timer) clearInterval(this.timer);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
