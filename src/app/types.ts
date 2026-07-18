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
