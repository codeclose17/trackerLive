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
}

export interface Settings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  syncEnabled: boolean;
  categories: Category[];
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
