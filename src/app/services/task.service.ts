import { Injectable } from '@angular/core';
import { BoredomActivity, FrictionCard, ImpulseLogEntry, PersonalRecords, RewardBank, RsdEntry, Task, WinLogEntry } from '../types';
import { IndexedDbService } from './indexed-db.service';

const TASKS_KEY = 'box_tracker_tasks';
const REWARD_BANK_KEY = 'box_tracker_reward_bank';
const WIN_LOG_KEY = 'box_tracker_win_log';
const IMPULSE_LOG_KEY = 'box_tracker_impulse_log';
const FRICTION_CARD_KEY = 'box_tracker_friction_card';
const BOREDOM_ACTIVITIES_KEY = 'box_tracker_boredom_activities';
const RSD_ENTRIES_KEY = 'box_tracker_rsd_entries';
const PERSONAL_RECORDS_KEY = 'box_tracker_personal_records';
const IDB_MIGRATED_KEY = 'box_tracker_idb_migrated_v1';

// Tasks, wins, impulse-log entries, and RSD entries are the app's
// high-write-frequency event logs — every completed block, logged urge, or
// captured thought used to trigger a full-array JSON.stringify back to
// localStorage, re-serializing the entire history on every single append.
// These four now persist through IndexedDB instead (see IndexedDbService),
// where each record is its own row and an append only writes that one row.
// [step 48]
//
// The public API here stays synchronous-looking (getTasks()/saveTasks())
// on purpose — 30+ call sites across the app already read/write this
// service assuming that shape, and converting all of them to async was a
// far larger blast radius than this step's actual goal (cheap appends)
// required. Reads are served from an in-memory cache that's warmed once
// on construction (falling back to localStorage synchronously for the very
// first paint, before the async IndexedDB load resolves); writes update
// the cache immediately and persist to IndexedDB in the background.
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksCache: Task[] = [];
  private winLogCache: WinLogEntry[] = [];
  private impulseLogCache: ImpulseLogEntry[] = [];
  private rsdEntriesCache: RsdEntry[] = [];

  // Callers that need the IndexedDB-backed data to be fully loaded before
  // reading (i.e. every read after the very first app-shell paint) should
  // `await taskService.ready` first — otherwise, on a second-or-later
  // session, getTasks()/getWinLog()/etc. can momentarily return the
  // (already-cleared) localStorage seed instead of the real IndexedDB data
  // while migrateAndLoad() is still in flight.
  readonly ready: Promise<void>;

  constructor(private idb: IndexedDbService) {
    // Seed the cache synchronously from localStorage first (so the very
    // first render — before IndexedDB's async open resolves — still has
    // whatever was there from a previous session), then reconcile with
    // IndexedDB, migrating any pre-existing localStorage data into it
    // exactly once.
    this.tasksCache = this.readLocalStorageArray<Task>(TASKS_KEY);
    this.winLogCache = this.readLocalStorageArray<WinLogEntry>(WIN_LOG_KEY);
    this.impulseLogCache = this.readLocalStorageArray<ImpulseLogEntry>(IMPULSE_LOG_KEY);
    this.rsdEntriesCache = this.readLocalStorageArray<RsdEntry>(RSD_ENTRIES_KEY);

    this.ready = this.migrateAndLoad();
  }

  private readLocalStorageArray<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private async migrateAndLoad(): Promise<void> {
    const alreadyMigrated = localStorage.getItem(IDB_MIGRATED_KEY) === 'true';

    if (!alreadyMigrated) {
      // One-time move: whatever was in localStorage becomes the seed data
      // in IndexedDB, then the localStorage copies are cleared (their job
      // is done — keeping both around would just be a second source of
      // truth that could drift).
      await Promise.all([
        this.idb.putAll('tasks', this.tasksCache),
        this.idb.putAll('winLog', this.winLogCache),
        this.idb.putAll('impulseLog', this.impulseLogCache),
        this.idb.putAll('rsdEntries', this.rsdEntriesCache)
      ]);
      localStorage.removeItem(TASKS_KEY);
      localStorage.removeItem(WIN_LOG_KEY);
      localStorage.removeItem(IMPULSE_LOG_KEY);
      localStorage.removeItem(RSD_ENTRIES_KEY);
      localStorage.setItem(IDB_MIGRATED_KEY, 'true');
      return;
    }

    // Already migrated in a previous session — IndexedDB is the source of
    // truth, refresh the in-memory cache from it.
    const [tasks, winLog, impulseLog, rsdEntries] = await Promise.all([
      this.idb.getAll<Task>('tasks'),
      this.idb.getAll<WinLogEntry>('winLog'),
      this.idb.getAll<ImpulseLogEntry>('impulseLog'),
      this.idb.getAll<RsdEntry>('rsdEntries')
    ]);
    this.tasksCache = tasks;
    this.winLogCache = winLog;
    this.impulseLogCache = impulseLog;
    this.rsdEntriesCache = rsdEntries;
  }

  getTasks(): Task[] {
    return this.tasksCache;
  }

  saveTasks(tasks: Task[]): void {
    this.tasksCache = tasks;
    // Bulk replace, since callers of saveTasks() already recompute the
    // whole filtered/updated array themselves (see app.component.ts) —
    // there's no cheaper single-row op to reach for here without changing
    // every call site's shape.
    void this.idb.putAll('tasks', tasks);
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
    // A single small object, not a growing log — localStorage is fine here.
    localStorage.setItem(REWARD_BANK_KEY, JSON.stringify(bank));
  }

  getWinLog(): WinLogEntry[] {
    return this.winLogCache;
  }

  saveWinLog(wins: WinLogEntry[]): void {
    this.winLogCache = wins;
    void this.idb.putAll('winLog', wins);
  }

  // The actual perf win over the old approach: appends a single row without
  // touching the rest of the log. Win-log entries are appended on nearly
  // every completion event throughout the app (blocks, rituals, instant-
  // wins, movement, boredom-kit, surfed impulses) — this is the single
  // highest-frequency write among these four stores, so it's the one
  // routed through the cheap single-row path rather than the bulk
  // putAll() every other save*() method still uses.
  appendWinEntry(entry: WinLogEntry): void {
    this.winLogCache = [...this.winLogCache, entry];
    void this.idb.add('winLog', entry);
  }

  getImpulseLog(): ImpulseLogEntry[] {
    return this.impulseLogCache;
  }

  saveImpulseLog(entries: ImpulseLogEntry[]): void {
    this.impulseLogCache = entries;
    void this.idb.putAll('impulseLog', entries);
  }

  // Same reasoning as appendWinEntry — impulse-log entries are only ever
  // appended (never bulk-edited), so route that specific write pattern
  // through the cheap single-row path.
  appendImpulseEntry(entry: ImpulseLogEntry): void {
    this.impulseLogCache = [...this.impulseLogCache, entry];
    void this.idb.add('impulseLog', entry);
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

  getRsdEntries(): RsdEntry[] {
    return this.rsdEntriesCache;
  }

  saveRsdEntries(entries: RsdEntry[]): void {
    this.rsdEntriesCache = entries;
    void this.idb.putAll('rsdEntries', entries);
  }

  getPersonalRecords(): PersonalRecords {
    try {
      const raw = localStorage.getItem(PERSONAL_RECORDS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  savePersonalRecords(records: PersonalRecords): void {
    localStorage.setItem(PERSONAL_RECORDS_KEY, JSON.stringify(records));
  }
}
