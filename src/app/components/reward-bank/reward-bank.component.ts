import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RewardBank } from '../../types';

@Component({
  selector: 'app-reward-bank',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reward-bank card">
      <h4>🎁 Reward bank</h4>
      <p class="ritual-hint">Finish a focus block, bank the minutes. Spend them on the thing you picked in advance — that's temptation bundling.</p>

      <div class="reward-bank-setup">
        <label>Earn <input type="number" min="1" max="60" [ngModel]="bank.minutesPerBlock" (ngModelChange)="updateMinutesPerBlock($event)"> min per block</label>
        <label class="reward-bank-activity-label">
          Reward
          <input type="text" placeholder="e.g. 15 min of a show" [ngModel]="bank.rewardActivity" (ngModelChange)="updateActivity($event)" maxlength="60">
        </label>
      </div>

      <div class="reward-bank-balance">
        <span class="reward-bank-minutes">{{ bank.bankedMinutes }}</span>
        <span class="reward-bank-label">min banked</span>
        <button class="btn btn-secondary" [disabled]="bank.bankedMinutes <= 0" (click)="spend()">Spend it</button>
      </div>
    </div>
  `
})
export class RewardBankComponent {
  @Input() bank: RewardBank = { minutesPerBlock: 5, bankedMinutes: 0 };
  @Output() bankChange = new EventEmitter<RewardBank>();
  @Output() spent = new EventEmitter<number>();

  updateMinutesPerBlock(value: number): void {
    this.bankChange.emit({ ...this.bank, minutesPerBlock: Math.max(1, value) });
  }

  updateActivity(value: string): void {
    this.bankChange.emit({ ...this.bank, rewardActivity: value });
  }

  spend(): void {
    if (this.bank.bankedMinutes <= 0) return;
    const spentMinutes = this.bank.bankedMinutes;
    this.bankChange.emit({ ...this.bank, bankedMinutes: 0 });
    this.spent.emit(spentMinutes);
  }
}
