import { Injectable } from '@angular/core';
import { BoredomActivity, FrictionCard, ImpulseLogEntry, RewardBank, Task, WinLogEntry } from '../types';

const TASKS_KEY = 'box_tracker_tasks';
const REWARD_BANK_KEY = 'box_tracker_reward_bank';
const WIN_LOG_KEY = 'box_tracker_win_log';
const IMPULSE_LOG_KEY = 'box_tracker_impulse_log';
const FRICTION_CARD_KEY = 'box_tracker_friction_card';
const BOREDOM_ACTIVITIES_KEY = 'box_tracker_boredom_activities';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  getTasks(): Task[] {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveTasks(tasks: Task[]): void {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  getRewardBank(): RewardBank {
    try {
      const raw = localStorage.getItem(REWARD_BANK_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* fall through to default */
    }
    return { minutesPerBlock: 5, bankedMinutes: 0 };
  }

  saveRewardBank(bank: RewardBank): void {
    localStorage.setItem(REWARD_BANK_KEY, JSON.stringify(bank));
  }

  getWinLog(): WinLogEntry[] {
    try {
      const raw = localStorage.getItem(WIN_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveWinLog(wins: WinLogEntry[]): void {
    localStorage.setItem(WIN_LOG_KEY, JSON.stringify(wins));
  }

  getImpulseLog(): ImpulseLogEntry[] {
    try {
      const raw = localStorage.getItem(IMPULSE_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveImpulseLog(entries: ImpulseLogEntry[]): void {
    localStorage.setItem(IMPULSE_LOG_KEY, JSON.stringify(entries));
  }

  getFrictionCard(): FrictionCard {
    try {
      const raw = localStorage.getItem(FRICTION_CARD_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* fall through to default */
    }
    return { whyText: '' };
  }

  saveFrictionCard(card: FrictionCard): void {
    localStorage.setItem(FRICTION_CARD_KEY, JSON.stringify(card));
  }

  getBoredomActivities(): BoredomActivity[] {
    try {
      const raw = localStorage.getItem(BOREDOM_ACTIVITIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveBoredomActivities(activities: BoredomActivity[]): void {
    localStorage.setItem(BOREDOM_ACTIVITIES_KEY, JSON.stringify(activities));
  }
}
