import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type TimerPhase = 'idle' | 'focus' | 'break';

interface PersistedTimerState {
  phase: TimerPhase;
  startedAt: number;   // epoch ms
  durationSec: number; // planned length of the current phase
  focusMinutes: number;
  breakMinutes: number;
  hyperfocusAcknowledgedAt?: number;
}

const STORAGE_KEY = 'box_tracker_focus_timer';
const HYPERFOCUS_GUARD_MINUTES = 90;

@Component({
  selector: 'app-focus-timer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="focus-timer-launcher card" *ngIf="phase === 'idle'">
      <span class="focus-timer-launcher-icon">◔</span>
      <div class="focus-timer-launcher-body">
        <h4>Focus timer</h4>
        <div class="focus-timer-edit-row">
          <label>Focus <input type="number" min="5" max="120" [(ngModel)]="focusMinutes" (click)="$event.stopPropagation()"> min</label>
          <label>Break <input type="number" min="1" max="30" [(ngModel)]="breakMinutes" (click)="$event.stopPropagation()"> min</label>
        </div>
      </div>
      <button class="btn btn-primary" (click)="openFullscreen()">Start</button>
    </div>

    <div class="focus-timer-fullscreen" *ngIf="phase !== 'idle'" [class.hyperfocus]="showHyperfocusGuard">
      <button class="focus-timer-close" (click)="stop()" aria-label="Exit focus timer">✕</button>

      <div class="focus-timer-ring-wrap">
        <svg viewBox="0 0 200 200" class="focus-timer-ring">
          <circle class="focus-timer-track" cx="100" cy="100" r="90"></circle>
          <circle
            class="focus-timer-fill"
            cx="100" cy="100" r="90"
            [style.strokeDasharray]="ringCircumference"
            [style.strokeDashoffset]="ringOffset"
          ></circle>
        </svg>
        <div class="focus-timer-center">
          <span class="focus-timer-phase">{{ phase === 'focus' ? 'Focus' : 'Break' }}</span>
          <span class="focus-timer-time">{{ formattedRemaining }}</span>
        </div>
      </div>

      <div class="focus-timer-thought-lot" *ngIf="phase === 'focus'">
        <input
          class="form-input"
          type="text"
          placeholder="Stray thought? Park it here without stopping the timer…"
          [(ngModel)]="thoughtDraft"
          (keydown.enter)="parkThought()"
        />
      </div>

      <div class="hyperfocus-banner" *ngIf="showHyperfocusGuard">
        <strong>⚠ 90 minutes straight.</strong>
        <p>Time to stand up, stretch, drink water — hyperfocus can quietly eat the whole day.</p>
        <button class="btn btn-primary" (click)="acknowledgeHyperfocus()">Got it — taking a break</button>
      </div>
    </div>
  `
})
export class FocusTimerComponent implements OnInit, OnDestroy {
  @Output() thoughtParked = new EventEmitter<string>();
  @Output() focusBlockCompleted = new EventEmitter<void>();
  @Output() hyperfocusGuardTriggered = new EventEmitter<void>();

  phase: TimerPhase = 'idle';
  focusMinutes = 25;
  breakMinutes = 5;
  remainingSec = 0;
  thoughtDraft = '';

  ringCircumference = 2 * Math.PI * 90;
  ringOffset = 0;

  showHyperfocusGuard = false;

  private startedAt = 0;
  private durationSec = 0;
  private continuousFocusStartedAt = 0;
  private hyperfocusAcknowledgedAt = 0;
  private tickTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.restore();
    this.tickTimer = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
  }

  private persist(): void {
    if (this.phase === 'idle') {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const state: PersistedTimerState = {
      phase: this.phase,
      startedAt: this.startedAt,
      durationSec: this.durationSec,
      focusMinutes: this.focusMinutes,
      breakMinutes: this.breakMinutes,
      hyperfocusAcknowledgedAt: this.hyperfocusAcknowledgedAt || undefined
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // Timer survives tab switch / reload: state is timestamp-based (startedAt +
  // durationSec), not a decrementing in-memory counter, so restoring just
  // recomputes elapsed time from wall-clock — no drift, no loss on refresh.
  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state: PersistedTimerState = JSON.parse(raw);
      this.phase = state.phase;
      this.startedAt = state.startedAt;
      this.durationSec = state.durationSec;
      this.focusMinutes = state.focusMinutes;
      this.breakMinutes = state.breakMinutes;
      this.hyperfocusAcknowledgedAt = state.hyperfocusAcknowledgedAt || 0;
      this.continuousFocusStartedAt = state.phase === 'focus' ? state.startedAt : 0;
      this.tick();
    } catch {
      /* ignore corrupt state */
    }
  }

  openFullscreen(): void {
    this.startPhase('focus');
  }

  private startPhase(phase: TimerPhase): void {
    this.phase = phase;
    this.startedAt = Date.now();
    this.durationSec = (phase === 'focus' ? this.focusMinutes : this.breakMinutes) * 60;
    if (phase === 'focus' && this.continuousFocusStartedAt === 0) {
      this.continuousFocusStartedAt = this.startedAt;
    }
    if (phase === 'break') {
      this.continuousFocusStartedAt = 0;
      this.showHyperfocusGuard = false;
      this.hyperfocusAcknowledgedAt = 0;
    }
    this.persist();
    this.tick();
  }

  stop(): void {
    this.phase = 'idle';
    this.continuousFocusStartedAt = 0;
    this.showHyperfocusGuard = false;
    this.persist();
  }

  private tick(): void {
    if (this.phase === 'idle') return;

    const elapsedSec = Math.floor((Date.now() - this.startedAt) / 1000);
    this.remainingSec = Math.max(0, this.durationSec - elapsedSec);
    this.ringOffset = this.ringCircumference * (1 - this.remainingSec / this.durationSec);

    if (this.remainingSec === 0) {
      if (this.phase === 'focus') {
        this.focusBlockCompleted.emit();
        this.startPhase('break');
      } else {
        this.stop();
      }
      return;
    }

    // Hyperfocus guard: fires once continuous focus time (across consecutive
    // focus phases with no break taken) crosses 90 minutes.
    if (this.phase === 'focus' && this.continuousFocusStartedAt > 0) {
      const continuousMin = (Date.now() - this.continuousFocusStartedAt) / 60000;
      if (continuousMin >= HYPERFOCUS_GUARD_MINUTES && !this.hyperfocusAcknowledgedAt) {
        if (!this.showHyperfocusGuard) {
          this.playHyperfocusChime();
          this.hyperfocusGuardTriggered.emit();
        }
        this.showHyperfocusGuard = true;
      }
    }
  }

  // Hard audio cue for the hyperfocus guard — synthesized via Web Audio so
  // no external asset is needed (keeps the app self-contained/offline-safe).
  // Three ascending tones, deliberately not a gentle single beep: hyperfocus
  // means normal-volume attention has already tuned the interface out.
  private playHyperfocusChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [440, 554, 659]; // A4, C#5, E5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.22);
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + i * 0.22 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.22 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.22);
        osc.stop(ctx.currentTime + i * 0.22 + 0.4);
      });
    } catch {
      /* audio not available — the visual banner still fires */
    }
  }

  acknowledgeHyperfocus(): void {
    this.hyperfocusAcknowledgedAt = Date.now();
    this.showHyperfocusGuard = false;
    this.persist();
    this.startPhase('break');
  }

  get formattedRemaining(): string {
    const m = Math.floor(this.remainingSec / 60).toString().padStart(2, '0');
    const s = (this.remainingSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  parkThought(): void {
    const text = this.thoughtDraft.trim();
    if (!text) return;
    this.thoughtParked.emit(text);
    this.thoughtDraft = '';
  }
}
