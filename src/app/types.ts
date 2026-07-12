export interface Category {
  id: string;
  name: string;
  color: string;
  isCustom?: boolean;
  updatedAt?: string;
}

export type DayHours = string[]; // Array of 24 category IDs

export interface DayRecord {
  date: string; // YYYY-MM-DD format (local time zone)
  hours: DayHours; // 24 entries, mapping 0..23 to Category.id
  notes: string; // Daily reflection notes
  updatedAt: string; // ISO string representing when the record was last saved
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
