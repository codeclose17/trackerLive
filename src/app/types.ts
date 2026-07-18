export interface Category {
  id: string;
  name: string;
  color: string;
  isCustom?: boolean;
  updatedAt?: string;
}

export type DayHours = string[]; // Array of 24 category IDs

// An implementation intention: "At <time> I will <action> at <place>".
// [Cheatcode 04, ADHD-KILLER-PLAN.md step 12]
export interface PlannedBlock {
  id: string;
  time: string;   // "HH:MM", 24h
  action: string;
  place: string;
  done?: boolean;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD format (local time zone)
  hours: DayHours; // 24 entries, mapping 0..23 to Category.id
  notes: string; // Daily reflection notes
  updatedAt: string; // ISO string representing when the record was last saved
  bingeCount?: number; // Daily manual counter of binge sessions

  // Now+Next planner: max 3 blocks (enforced in the component), step 12
  plannedBlocks?: PlannedBlock[];

  // Morning launch ritual, step 13
  morningRitualDone?: boolean;
  morningPriority?: string; // "today wins if..."
  morningSleepConfirmed?: boolean;

  // Evening shutdown ritual, step 14
  eveningRitualDone?: boolean;
  eveningReflection1?: string;
  eveningReflection2?: string;

  // Body regulators — Phase E, steps 28-34
  morningLightDone?: boolean;         // step 29: sunlight chip
  movementLog?: MovementEntry[];      // step 30
  proteinBreakfastDone?: boolean;     // step 31
  caffeineLog?: CaffeineEntry[];      // step 32
  stressResetCount?: number;          // step 33: physiological sighs done today
  coldExposureDone?: boolean;         // step 33
  cycleDay?: number;                  // step 34, opt-in only
}

// [step 30] Movement logged for the "exercise = natural stimulant" hint.
export interface MovementEntry {
  id: string;
  type: string; // free text: "walk", "farm work", "run"...
  minutes: number;
  loggedAt: string; // ISO timestamp — the focus-window hint counts 90 min from here
}

// [step 32]
export interface CaffeineEntry {
  id: string;
  loggedAt: string; // ISO timestamp
}

export interface Settings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  syncEnabled: boolean;
  categories: Category[];
  gamification?: GamificationState; // step 23
  wakeTimeTarget?: string; // "HH:MM", step 28
  cycleAwareModeEnabled?: boolean; // step 34, off by default
}

// XP & levels. Stored on Settings (not a separate blob) so it rides the
// existing Supabase sync path for free — "XP persists and syncs" without
// building parallel sync plumbing. [step 23]
export interface GamificationState {
  xp: number;
}

// A single win — auto-appended on completions, or added manually.
// [step 24]
export interface WinLogEntry {
  id: string;
  text: string;
  createdAt: string;
  source: 'block' | 'ritual' | 'manual' | 'instant-win';
}

export type ImpulseTrigger = 'bored' | 'anxious' | 'tired' | 'phone';
export type ImpulseOutcome = 'acted' | 'surfed';

// Replaces the plain binge tally with a real log: urge-vs-acted, a trigger
// tag, and whether the user surfed the urge (didn't act) — the delay
// itself is the intervention. [step 25]
export interface ImpulseLogEntry {
  id: string;
  date: string; // YYYY-MM-DD, local
  trigger: ImpulseTrigger;
  outcome: ImpulseOutcome;
  createdAt: string;
}

// User-authored reminder shown before "continue anyway" on a logged
// impulse. [step 26]
export interface FrictionCard {
  whyText: string;
}

// Up to 5 user-defined dopamine-safe quick activities for the "I'm bored"
// button. [step 27]
export interface BoredomActivity {
  id: string;
  text: string;
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncedAt?: string;
  errorMessage?: string;
}

export interface SyncLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export type EnergyLevel = 'low' | 'med' | 'high';

// A task, from raw brain-dump through to a schedulable, shreddable unit of
// work. [ADHD-KILLER-PLAN.md Phase C — steps 15-21]
export interface Task {
  id: string;
  text: string;
  createdAt: string;

  // Step 16: the task shredder. A task can't be scheduled until it has a
  // concrete, small first step.
  firstAction?: string;      // "the first physical action, <=10 min"
  isTwoMinuteTask?: boolean; // step 17: instant-win lane

  // Step 19: energy matching
  energy?: EnergyLevel;

  // Step 21: deadline scaffolding
  dueDate?: string;      // YYYY-MM-DD
  isMilestone?: boolean; // auto-generated backwards milestone, not the task itself
  parentTaskId?: string; // milestones point back at the task they scaffold

  done: boolean;
  doneAt?: string;
  updatedAt: string;
}

// Banked reward minutes from temptation bundling. [step 20]
export interface RewardBank {
  minutesPerBlock: number; // how many minutes a completed focus block earns
  bankedMinutes: number;
  rewardActivity?: string; // what the banked minutes are "spent" on, chosen in advance
}
