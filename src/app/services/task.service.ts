import { Injectable } from '@angular/core';
import { RewardBank, Task } from '../types';

const TASKS_KEY = 'box_tracker_tasks';
const REWARD_BANK_KEY = 'box_tracker_reward_bank';

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
}
