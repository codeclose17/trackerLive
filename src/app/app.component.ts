import { Component, OnInit, OnDestroy, HostListener, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { CategoryPickerComponent } from './components/category-picker/category-picker.component';
import { StatsDashboardComponent } from './components/stats-dashboard/stats-dashboard.component';
import { SettingsModalComponent } from './components/settings-modal/settings-modal.component';
import { DayProgressBarComponent } from './components/shared/day-progress-bar/day-progress-bar.component';
import { TodayViewComponent } from './components/today-view/today-view.component';
import { WeekViewComponent } from './components/week-view/week-view.component';
import { PlannerPanelComponent } from './components/planner-panel/planner-panel.component';
import { MorningRitualComponent, MorningRitualResult } from './components/morning-ritual/morning-ritual.component';
import { EveningRitualComponent, EveningRitualResult } from './components/evening-ritual/evening-ritual.component';
import { HourlyQuickLogComponent } from './components/hourly-quick-log/hourly-quick-log.component';
import { Category, DayRecord, PlannedBlock, Settings, SyncState } from './types';
import { DbService } from './services/db.service';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'sleep', name: 'Sleep', color: '#7C6BF0' },
  { id: 'work', name: 'Work', color: '#4EA8DE' },
  { id: 'learn', name: 'Learn', color: '#57D9A3' },
  { id: 'social', name: 'Social Media', color: '#FF6B9D' },
  { id: 'exercise', name: 'Exercise', color: '#FFB347' },
  { id: 'idle', name: 'Idle / Uncategorized', color: '#2A2438' }
];

// One-time recolor of the built-in categories to the Cadence identity palette.
// Runs once per device (flag below). Only touches a category still holding its
// original default color — user-customized colors are left untouched.
const CATEGORY_COLOR_MIGRATION: Record<string, { from: string; to: string }> = {
  sleep: { from: '#6366f1', to: '#7C6BF0' },
  work: { from: '#3b82f6', to: '#4EA8DE' },
  learn: { from: '#10b981', to: '#57D9A3' },
  social: { from: '#f43f5e', to: '#FF6B9D' },
  exercise: { from: '#f59e0b', to: '#FFB347' },
  idle: { from: '#27272a', to: '#2A2438' }
};
const COLOR_MIGRATION_FLAG = 'box_tracker_color_migration_v1';

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfWeekSunday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return date;
};

const generateDateRange = (startDate: Date, length: number): string[] => {
  const dates: string[] = [];
  for (let i = 0; i < length; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(getLocalDateString(d));
  }
  return dates;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    CategoryPickerComponent,
    StatsDashboardComponent,
    SettingsModalComponent,
    DayProgressBarComponent,
    TodayViewComponent,
    WeekViewComponent,
    PlannerPanelComponent,
    MorningRitualComponent,
    EveningRitualComponent,
    HourlyQuickLogComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  // 14-day window: still the source of truth for Insights/stats aggregates
  // (long-range data lives there, never as a pixel grid — see step 7 of
  // ADHD-KILLER-PLAN.md). Not shown as a grid anywhere anymore.
  startDate: Date = getStartOfWeekSunday(new Date());
  dates: string[] = generateDateRange(this.startDate, 14);

  // 7-day window for the Week (rhythm) tab.
  weekStartDate: Date = getStartOfWeekSunday(new Date());
  weekDates: string[] = generateDateRange(this.weekStartDate, 7);

  todayDate: string = getLocalDateString(new Date());

  isDarkMode = true;

  @ViewChild('kbFrame') kbFrame?: ElementRef<HTMLIFrameElement>;

  records: Record<string, DayRecord> = {};

  settings: Settings = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    syncEnabled: false,
    categories: DEFAULT_CATEGORIES
  };

  activeCategoryId = 'work';
  selectedDate: string = getLocalDateString(new Date());

  activeTab: 'today' | 'week' | 'stats' | 'learn' = 'today';
  isSettingsOpen = false;
  syncState: SyncState = { status: 'idle' };

  // Rituals — dismissed-for-session flags so skipping doesn't nag again
  // until the next day (step 13/14).
  morningRitualDismissed = false;
  eveningRitualDismissed = false;

  // Configurable evening-ritual start hour (0-23), persisted in localStorage.
  private static readonly EVENING_RITUAL_HOUR_KEY = 'box_tracker_evening_ritual_hour';
  private static readonly DEFAULT_EVENING_RITUAL_HOUR = 20;
  eveningRitualHour = AppComponent.DEFAULT_EVENING_RITUAL_HOUR;

  // Hourly quick-log (step 11): prompts for the most recent past unlogged
  // hour of today, one at a time, dismissible.
  quickLogHourIndex: number | null = null;
  private dismissedQuickLogHours = new Set<number>();

  private unsubscribeRealtime: () => void = () => {};
  private unsubscribeCategoriesRealtime: () => void = () => {};
  private syncTimers: Record<string, any> = {};

  constructor(private dbService: DbService, private zone: NgZone) {}

  ngOnInit(): void {
    // Load local settings & records
    this.settings = this.dbService.getLocalSettings(DEFAULT_CATEGORIES);
    this.records = this.dbService.getLocalRecords();

    // Auto-enable sync if keys exist in localStorage but sync is disabled
    if (this.settings.supabaseUrl && this.settings.supabaseAnonKey && !this.settings.syncEnabled) {
      this.settings.syncEnabled = true;
      this.dbService.saveLocalSettings(this.settings);
    }
    
    // Load appearance setting (single identity, dark by default)
    this.isDarkMode = localStorage.getItem('box_tracker_dark_mode') !== 'false';
    this.applyTheme();

    // Load configurable evening-ritual start hour
    const savedEveningHour = localStorage.getItem(AppComponent.EVENING_RITUAL_HOUR_KEY);
    if (savedEveningHour !== null) {
      const parsed = parseInt(savedEveningHour, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 23) {
        this.eveningRitualHour = parsed;
      }
    }

    // Apply categories as CSS variables
    this.applyCssVariables();

    // One-time recolor of the saved default palette to the Cadence identity
    this.migrateCategoryColors();

    // Trigger initial sync
    this.initSync();

    // Compute today's ritual/quick-log state now that records are loaded
    this.refreshQuickLogPrompt();
  }

  // ---- Hourly quick-log (step 11) ----
  // Finds the most recent fully-elapsed hour of today that's still 'idle'
  // and hasn't been dismissed this session, and offers it up for a one-tap
  // log. Externalizes the "what did I just do?" question instead of relying
  // on end-of-day guessing / working memory.
  private refreshQuickLogPrompt(): void {
    const currentHour = new Date().getHours();
    const record = this.records[this.todayDate];
    const hours = record?.hours ?? Array(24).fill('idle');

    for (let h = currentHour - 1; h >= 0; h--) {
      if (this.dismissedQuickLogHours.has(h)) continue;
      if (hours[h] === 'idle') {
        this.quickLogHourIndex = h;
        return;
      }
    }
    this.quickLogHourIndex = null;
  }

  handleQuickLogHour(event: { hourIndex: number; categoryId: string }): void {
    this.handlePaintCell({ date: this.todayDate, hourIndex: event.hourIndex, categoryId: event.categoryId });
    this.dismissedQuickLogHours.add(event.hourIndex);
    this.refreshQuickLogPrompt();
  }

  handleDismissQuickLog(): void {
    if (this.quickLogHourIndex !== null) {
      this.dismissedQuickLogHours.add(this.quickLogHourIndex);
    }
    this.refreshQuickLogPrompt();
  }

  // ---- Morning / evening rituals (steps 13/14) ----
  get showMorningRitual(): boolean {
    if (this.morningRitualDismissed) return false;
    const record = this.records[this.todayDate];
    return !record?.morningRitualDone;
  }

  get showEveningRitual(): boolean {
    if (this.eveningRitualDismissed) return false;
    if (new Date().getHours() < this.eveningRitualHour) return false;
    const record = this.records[this.todayDate];
    return !record?.eveningRitualDone;
  }

  handleEveningRitualHourChange(hour: number): void {
    this.eveningRitualHour = hour;
    localStorage.setItem(AppComponent.EVENING_RITUAL_HOUR_KEY, String(hour));
  }

  private getOrCreateTodayRecord(): DayRecord {
    return this.records[this.todayDate] || {
      date: this.todayDate,
      hours: Array(24).fill('idle'),
      notes: '',
      updatedAt: new Date().toISOString()
    };
  }

  handleMorningRitualDone(result: MorningRitualResult): void {
    const existing = this.getOrCreateTodayRecord();
    const updated: DayRecord = {
      ...existing,
      morningRitualDone: true,
      morningSleepConfirmed: result.sleepConfirmed,
      morningPriority: result.priority,
      updatedAt: new Date().toISOString()
    };
    this.records = { ...this.records, [this.todayDate]: updated };
    this.dbService.saveLocalRecords(this.records);
    this.queueSupabaseSync(this.todayDate);
  }

  handleSkipMorningRitual(): void {
    this.morningRitualDismissed = true;
  }

  handleEveningRitualDone(result: EveningRitualResult): void {
    const existing = this.getOrCreateTodayRecord();
    const updated: DayRecord = {
      ...existing,
      eveningRitualDone: true,
      eveningReflection1: result.reflection1,
      eveningReflection2: result.reflection2,
      updatedAt: new Date().toISOString()
    };
    this.records = { ...this.records, [this.todayDate]: updated };
    this.dbService.saveLocalRecords(this.records);
    this.queueSupabaseSync(this.todayDate);

    // Pre-decide tomorrow's first block, on tomorrow's record
    if (result.tomorrowTime && result.tomorrowAction) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = getLocalDateString(tomorrow);
      const tomorrowExisting = this.records[tomorrowDate] || {
        date: tomorrowDate,
        hours: Array(24).fill('idle'),
        notes: '',
        updatedAt: new Date().toISOString()
      };
      const newBlock: PlannedBlock = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        time: result.tomorrowTime,
        action: result.tomorrowAction,
        place: '',
        done: false
      };
      const tomorrowUpdated: DayRecord = {
        ...tomorrowExisting,
        plannedBlocks: [...(tomorrowExisting.plannedBlocks || []), newBlock].slice(0, 3),
        updatedAt: new Date().toISOString()
      };
      this.records = { ...this.records, [tomorrowDate]: tomorrowUpdated };
      this.dbService.saveLocalRecords(this.records);
      this.queueSupabaseSync(tomorrowDate);
    }
  }

  handleSkipEveningRitual(): void {
    this.eveningRitualDismissed = true;
  }

  // ---- Now+Next planner (step 12) ----
  scrollToPlanner(): void {
    document.getElementById('planner-panel-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  handlePlannedBlocksChange(dateStr: string, blocks: PlannedBlock[]): void {
    const existing = this.records[dateStr] || {
      date: dateStr,
      hours: Array(24).fill('idle'),
      notes: '',
      updatedAt: new Date().toISOString()
    };
    const updated: DayRecord = {
      ...existing,
      plannedBlocks: blocks.slice(0, 3),
      updatedAt: new Date().toISOString()
    };
    this.records = { ...this.records, [dateStr]: updated };
    this.dbService.saveLocalRecords(this.records);
    this.queueSupabaseSync(dateStr);
  }

  // Recolor still-default categories to the new identity palette, persist the
  // change locally, and push it to Supabase. Because each recolored category
  // gets a fresh updatedAt, initSync()'s merge also re-uploads any that don't
  // land here, so the update propagates even if the first push fails.
  private migrateCategoryColors(): void {
    if (localStorage.getItem(COLOR_MIGRATION_FLAG) === 'done') return;

    const now = new Date().toISOString();
    const changed: Category[] = [];
    const updatedCategories = this.settings.categories.map((cat) => {
      const rule = CATEGORY_COLOR_MIGRATION[cat.id];
      if (rule && cat.color.toLowerCase() === rule.from.toLowerCase()) {
        const recolored: Category = { ...cat, color: rule.to, updatedAt: now };
        changed.push(recolored);
        return recolored;
      }
      return cat;
    });

    localStorage.setItem(COLOR_MIGRATION_FLAG, 'done');
    if (changed.length === 0) return;

    this.settings = { ...this.settings, categories: updatedCategories };
    this.dbService.saveLocalSettings(this.settings);
    this.applyCssVariables();

    const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
    if (syncEnabled && supabaseUrl && supabaseAnonKey) {
      changed.forEach((cat) =>
        this.dbService.upsertCategory(supabaseUrl, supabaseAnonKey, cat).catch(console.error)
      );
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
    }
    if (this.unsubscribeCategoriesRealtime) {
      this.unsubscribeCategoriesRealtime();
    }
  }

  private applyCssVariables(): void {
    this.settings.categories.forEach((cat) => {
      // Empty cells are theme-managed (see --color-idle in styles.css) so they
      // recede in both light and dark, rather than baking in a single hex.
      if (cat.id === 'idle') return;
      document.documentElement.style.setProperty(`--color-${cat.id}`, cat.color);
    });
  }

  applyTheme(): void {
    const mode = this.isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('box_tracker_dark_mode', this.isDarkMode ? 'true' : 'false');
    this.syncKnowledgeBaseTheme();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
  }

  // Mirror the app's light/dark choice into the embedded knowledge base iframe
  // (same-origin asset, so we can set its theme attribute directly).
  syncKnowledgeBaseTheme(): void {
    const doc = this.kbFrame?.nativeElement?.contentDocument;
    if (!doc?.documentElement) return;
    try {
      doc.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
    } catch {
      /* cross-origin or not yet ready — ignore */
    }
  }

  private async initSync(): Promise<void> {
    // Unsubscribe from previous realtime channel
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
    }
    if (this.unsubscribeCategoriesRealtime) {
      this.unsubscribeCategoriesRealtime();
    }

    const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
    if (!syncEnabled || !supabaseUrl || !supabaseAnonKey) {
      this.zone.run(() => {
        this.syncState = { status: 'idle' };
      });
      return;
    }

    this.zone.run(() => {
      this.syncState = { status: 'syncing' };
    });

    try {
      // 1. Pull and merge categories
      const remoteCategoriesList = await this.dbService.fetchCategories(supabaseUrl, supabaseAnonKey);
      const localCategories = this.settings.categories;
      const mergedCategories: Category[] = [...localCategories];
      let categoriesChanged = false;

      const remoteCatMap = new Map(remoteCategoriesList.map(c => [c.id, c]));
      const localCatMap = new Map(localCategories.map(c => [c.id, c]));

      remoteCategoriesList.forEach((remoteCat) => {
        const localCat = localCatMap.get(remoteCat.id);
        if (!localCat) {
          mergedCategories.push(remoteCat);
          categoriesChanged = true;
        } else {
          const remoteTime = remoteCat.updatedAt ? new Date(remoteCat.updatedAt).getTime() : 0;
          const localTime = localCat.updatedAt ? new Date(localCat.updatedAt).getTime() : 0;
          if (remoteTime > localTime) {
            const index = mergedCategories.findIndex(c => c.id === remoteCat.id);
            if (index !== -1) {
              mergedCategories[index] = remoteCat;
              categoriesChanged = true;
            }
          } else if (localTime > remoteTime) {
            this.dbService.upsertCategory(supabaseUrl, supabaseAnonKey, localCat).catch(console.error);
          }
        }
      });

      localCategories.forEach((localCat) => {
        if (!remoteCatMap.has(localCat.id)) {
          this.dbService.upsertCategory(supabaseUrl, supabaseAnonKey, {
            ...localCat,
            updatedAt: localCat.updatedAt || new Date().toISOString()
          }).catch(console.error);
        }
      });

      if (categoriesChanged) {
        const activeCats = mergedCategories.filter(c => c.id !== 'idle');
        const idleCat = mergedCategories.find(c => c.id === 'idle') || { id: 'idle', name: 'Idle / Uncategorized', color: '#27272a' };
        const finalCategories = [...activeCats, idleCat];

        this.zone.run(() => {
          this.settings = { ...this.settings, categories: finalCategories };
          this.dbService.saveLocalSettings(this.settings);
          this.applyCssVariables();
        });
      }

      // 2. Pull remote records
      const remoteRecordsList = await this.dbService.fetchRecords(supabaseUrl, supabaseAnonKey);
      
      const localRecords = this.dbService.getLocalRecords();
      const mergedRecords: Record<string, DayRecord> = { ...localRecords };
      let hasChanges = false;

      remoteRecordsList.forEach((remoteRec) => {
        const localRec = localRecords[remoteRec.date];
        if (!localRec) {
          mergedRecords[remoteRec.date] = remoteRec;
          hasChanges = true;
        } else {
          const remoteTime = new Date(remoteRec.updatedAt).getTime();
          const localTime = new Date(localRec.updatedAt).getTime();
          if (remoteTime > localTime) {
            mergedRecords[remoteRec.date] = remoteRec;
            hasChanges = true;
          } else if (localTime > remoteTime) {
            // Local is newer, upload in background
            this.dbService.upsertRecord(supabaseUrl, supabaseAnonKey, localRec).catch(console.error);
          }
        }
      });

      this.zone.run(() => {
        if (hasChanges) {
          this.dbService.saveLocalRecords(mergedRecords);
          this.records = mergedRecords;
        }

        this.syncState = {
          status: 'success',
          lastSyncedAt: new Date().toLocaleTimeString()
        };
      });

      // Set up real-time sync stream for categories
      this.unsubscribeCategoriesRealtime = this.dbService.subscribeToCategoryChanges(
        supabaseUrl,
        supabaseAnonKey,
        (updatedCat) => {
          this.zone.run(() => {
            const index = this.settings.categories.findIndex(c => c.id === updatedCat.id);
            const remoteTime = updatedCat.updatedAt ? new Date(updatedCat.updatedAt).getTime() : 0;
            
            if (index === -1) {
              const activeCats = this.settings.categories.filter(c => c.id !== 'idle');
              const idleCat = this.settings.categories.find(c => c.id === 'idle') || { id: 'idle', name: 'Idle / Uncategorized', color: '#27272a' };
              const finalCategories = [...activeCats, updatedCat, idleCat];
              
              this.settings = { ...this.settings, categories: finalCategories };
              this.dbService.saveLocalSettings(this.settings);
              this.applyCssVariables();
            } else {
              const localCat = this.settings.categories[index];
              const localTime = localCat.updatedAt ? new Date(localCat.updatedAt).getTime() : 0;
              if (remoteTime > localTime) {
                const updatedCategories = this.settings.categories.map(c => c.id === updatedCat.id ? updatedCat : c);
                this.settings = { ...this.settings, categories: updatedCategories };
                this.dbService.saveLocalSettings(this.settings);
                this.applyCssVariables();
              }
            }
          });
        },
        (deletedCatId) => {
          this.zone.run(() => {
            const exists = this.settings.categories.some(c => c.id === deletedCatId);
            if (exists) {
              const updatedCategories = this.settings.categories.filter((c) => c.id !== deletedCatId);
              this.settings = { ...this.settings, categories: updatedCategories };
              this.dbService.saveLocalSettings(this.settings);

              // Reset deleted categories in local records to 'idle'
              const nextRecords = { ...this.records };
              let affected = false;

              Object.keys(nextRecords).forEach((d) => {
                const record = nextRecords[d];
                if (record.hours.includes(deletedCatId)) {
                  affected = true;
                  nextRecords[d] = {
                    ...record,
                    hours: record.hours.map((h) => (h === deletedCatId ? 'idle' : h)),
                    updatedAt: new Date().toISOString()
                  };
                }
              });

              if (affected) {
                this.dbService.saveLocalRecords(nextRecords);
                this.records = nextRecords;
              }

              if (this.activeCategoryId === deletedCatId) {
                this.activeCategoryId = 'work';
              }
              
              this.applyCssVariables();
            }
          });
        }
      );

      // Set up real-time sync stream for records
      this.unsubscribeRealtime = this.dbService.subscribeToChanges(
        supabaseUrl,
        supabaseAnonKey,
        (updatedRecord) => {
          this.zone.run(() => {
            const localRec = this.records[updatedRecord.date];
            const remoteTime = new Date(updatedRecord.updatedAt).getTime();
            const localTime = localRec ? new Date(localRec.updatedAt).getTime() : 0;

            if (remoteTime > localTime) {
              this.records = {
                ...this.records,
                [updatedRecord.date]: updatedRecord
              };
              this.dbService.saveLocalRecords(this.records);
            }
          });
        }
      );

    } catch (err: any) {
      console.error('Initial sync failed:', err);
      this.zone.run(() => {
        this.syncState = {
          status: 'error',
          errorMessage: err.message || 'Failed to sync with cloud database.'
        };
      });
    }
  }

  // Keyboard listener for number keys (1-5) and 'e' / 'E' for Eraser
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const keyVal = parseInt(event.key, 10);
    if (!isNaN(keyVal) && keyVal >= 1 && keyVal <= this.settings.categories.length) {
      const cat = this.settings.categories[keyVal - 1];
      if (cat) {
        this.activeCategoryId = cat.id;
      }
    } else if (event.key.toLowerCase() === 'e') {
      this.activeCategoryId = 'idle';
    }
  }

  // Debounced database sync queue
  private queueSupabaseSync(date: string): void {
    const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
    if (!syncEnabled || !supabaseUrl || !supabaseAnonKey) return;

    this.syncState = { status: 'syncing' };

    if (this.syncTimers[date]) {
      clearTimeout(this.syncTimers[date]);
    }

    this.syncTimers[date] = setTimeout(() => {
      this.syncRecordToSupabase(date);
      delete this.syncTimers[date];
    }, 750); // 750ms debounce window (ensures drag/typing is finished)
  }

  private syncRecordToSupabase(date: string): void {
    const record = this.records[date];
    if (!record) return;

    const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
    if (!syncEnabled || !supabaseUrl || !supabaseAnonKey) return;

    this.dbService.upsertRecord(supabaseUrl, supabaseAnonKey, record)
      .then(() => {
        this.syncState = {
          status: 'success',
          lastSyncedAt: new Date().toLocaleTimeString()
        };
      })
      .catch((err) => {
        console.error(`Failed to sync record for date ${date}:`, err);
        this.syncState = {
          status: 'error',
          errorMessage: 'Failed to sync modifications.'
        };
      });
  }

  // Paint a cell
  handlePaintCell(event: { date: string; hourIndex: number; categoryId: string }): void {
    const { date, hourIndex, categoryId } = event;
    const existingRecord = this.records[date] || {
      date: date,
      hours: Array(24).fill('idle'),
      notes: '',
      updatedAt: new Date().toISOString()
    };

    const nextHours = [...existingRecord.hours];
    nextHours[hourIndex] = categoryId;

    const updatedRecord: DayRecord = {
      ...existingRecord,
      hours: nextHours,
      updatedAt: new Date().toISOString()
    };

    this.records = {
      ...this.records,
      [date]: updatedRecord
    };
    this.dbService.saveLocalRecords(this.records);

    // If painting today directly, the quick-log banner for that hour (if
    // it was showing) is now moot — recompute so it doesn't keep asking
    // about an hour the user just logged on the timeline.
    if (date === this.todayDate) {
      this.dismissedQuickLogHours.add(hourIndex);
      this.refreshQuickLogPrompt();
    }

    // Debounce background sync to avoid concurrent write race conditions
    this.queueSupabaseSync(date);
  }

  // Update Notes
  handleUpdateNotes(event: { date: string; notes: string }): void {
    const { date, notes } = event;
    const existingRecord = this.records[date] || {
      date: date,
      hours: Array(24).fill('idle'),
      notes: '',
      updatedAt: new Date().toISOString()
    };

    const updatedRecord: DayRecord = {
      ...existingRecord,
      notes: notes,
      updatedAt: new Date().toISOString()
    };

    this.records = {
      ...this.records,
      [date]: updatedRecord
    };
    this.dbService.saveLocalRecords(this.records);

    // Debounce background sync to avoid keystroke race conditions
    this.queueSupabaseSync(date);
  }

  // Update Binge Count
  handleUpdateBingeCount(event: { date: string; count: number }): void {
    const { date, count } = event;
    const existingRecord = this.records[date] || {
      date: date,
      hours: Array(24).fill('idle'),
      notes: '',
      updatedAt: new Date().toISOString()
    };

    const updatedRecord: DayRecord = {
      ...existingRecord,
      bingeCount: count,
      updatedAt: new Date().toISOString()
    };

    this.records = {
      ...this.records,
      [date]: updatedRecord
    };
    this.dbService.saveLocalRecords(this.records);

    // Sync in background
    this.queueSupabaseSync(date);
  }

  // Save Settings Modal
  handleSaveSettings(newSyncSettings: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    syncEnabled: boolean;
  }): void {
    this.settings = {
      ...this.settings,
      ...newSyncSettings
    };
    this.dbService.saveLocalSettings(this.settings);
    this.isSettingsOpen = false;

    // Trigger sync restart
    this.initSync();
  }

  // Categories palette additions/changes
  handleAddCategory(newCat: Category): void {
    const activeCats = this.settings.categories.filter(c => c.id !== 'idle');
    const idleCat = this.settings.categories.find(c => c.id === 'idle')!;
    
    const timestampedCat = {
      ...newCat,
      updatedAt: new Date().toISOString()
    };
    const updatedCategories = [...activeCats, timestampedCat, idleCat];
    
    this.settings = { ...this.settings, categories: updatedCategories };
    this.dbService.saveLocalSettings(this.settings);
    this.applyCssVariables();

    // Sync in background
    const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
    if (syncEnabled && supabaseUrl && supabaseAnonKey) {
      this.syncState = { status: 'syncing' };
      this.dbService.upsertCategory(supabaseUrl, supabaseAnonKey, timestampedCat)
        .then(() => {
          this.syncState = {
            status: 'success',
            lastSyncedAt: new Date().toLocaleTimeString()
          };
        })
        .catch((err) => {
          console.error('Failed to sync category addition:', err);
          this.syncState = {
            status: 'error',
            errorMessage: err.message || 'Failed to sync category addition.'
          };
        });
    }
  }

  handleUpdateCategory(updatedCat: Category): void {
    const timestampedCat = {
      ...updatedCat,
      updatedAt: new Date().toISOString()
    };
    const updatedCategories = this.settings.categories.map((c) =>
      c.id === updatedCat.id ? timestampedCat : c
    );
    this.settings = { ...this.settings, categories: updatedCategories };
    this.dbService.saveLocalSettings(this.settings);
    this.applyCssVariables();

    // Sync in background
    const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
    if (syncEnabled && supabaseUrl && supabaseAnonKey) {
      this.syncState = { status: 'syncing' };
      this.dbService.upsertCategory(supabaseUrl, supabaseAnonKey, timestampedCat)
        .then(() => {
          this.syncState = {
            status: 'success',
            lastSyncedAt: new Date().toLocaleTimeString()
          };
        })
        .catch((err) => {
          console.error('Failed to sync category update:', err);
          this.syncState = {
            status: 'error',
            errorMessage: err.message || 'Failed to sync category update.'
          };
        });
    }
  }

  handleDeleteCategory(catId: string): void {
    const updatedCategories = this.settings.categories.filter((c) => c.id !== catId);
    this.settings = { ...this.settings, categories: updatedCategories };
    this.dbService.saveLocalSettings(this.settings);

    // Sync deletion in background
    const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
    if (syncEnabled && supabaseUrl && supabaseAnonKey) {
      this.syncState = { status: 'syncing' };
      this.dbService.deleteCategory(supabaseUrl, supabaseAnonKey, catId)
        .then(() => {
          this.syncState = {
            status: 'success',
            lastSyncedAt: new Date().toLocaleTimeString()
          };
        })
        .catch((err) => {
          console.error('Failed to sync category deletion:', err);
          this.syncState = {
            status: 'error',
            errorMessage: err.message || 'Failed to sync category deletion.'
          };
        });
    }

    // Reset deleted categories in local records to 'idle'
    const nextRecords = { ...this.records };
    let affected = false;

    Object.keys(nextRecords).forEach((d) => {
      const record = nextRecords[d];
      if (record.hours.includes(catId)) {
        affected = true;
        nextRecords[d] = {
          ...record,
          hours: record.hours.map((h) => (h === catId ? 'idle' : h)),
          updatedAt: new Date().toISOString()
        };

        // Sync updates in background
        if (syncEnabled && supabaseUrl && supabaseAnonKey) {
          this.dbService.upsertRecord(supabaseUrl, supabaseAnonKey, nextRecords[d]).catch(console.error);
        }
      }
    });

    if (affected) {
      this.dbService.saveLocalRecords(nextRecords);
      this.records = nextRecords;
    }

    if (this.activeCategoryId === catId) {
      this.activeCategoryId = 'work';
    }
    
    this.applyCssVariables();
  }

  // Period shifting functions (drives the 14-day Insights aggregate window)
  handlePrevPeriod(): void {
    const newStart = new Date(this.startDate);
    newStart.setDate(this.startDate.getDate() - 14);
    this.startDate = newStart;
    this.dates = generateDateRange(this.startDate, 14);
  }

  handleNextPeriod(): void {
    const newStart = new Date(this.startDate);
    newStart.setDate(this.startDate.getDate() + 14);
    this.startDate = newStart;
    this.dates = generateDateRange(this.startDate, 14);
  }

  handleResetPeriod(): void {
    this.startDate = getStartOfWeekSunday(new Date());
    this.dates = generateDateRange(this.startDate, 14);
  }

  // Week (rhythm) tab navigation — independent 7-day window
  handlePrevWeek(): void {
    const newStart = new Date(this.weekStartDate);
    newStart.setDate(this.weekStartDate.getDate() - 7);
    this.weekStartDate = newStart;
    this.weekDates = generateDateRange(this.weekStartDate, 7);
  }

  handleNextWeek(): void {
    const newStart = new Date(this.weekStartDate);
    newStart.setDate(this.weekStartDate.getDate() + 7);
    this.weekStartDate = newStart;
    this.weekDates = generateDateRange(this.weekStartDate, 7);
  }

  // Week's "edit this day" opens the Today view scoped to that date — same
  // 24-hour timeline UI, just not necessarily *today*.
  handleOpenWeekDay(dateStr: string): void {
    this.selectedDate = dateStr;
    this.activeTab = 'today';
  }

  get todayViewRecord(): DayRecord | null {
    return this.records[this.selectedDate] || null;
  }

  // Backup Export/Import
  handleExportData(): void {
    const localData = {
      records: this.dbService.getLocalRecords(),
      categories: this.settings.categories
    };
    const jsonStr = JSON.stringify(localData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadence-backup-${getLocalDateString(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async handleImportData(file: File): Promise<void> {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          const importedRecords = parsed.records || {};
          const importedCategories = parsed.categories || [];
          
          const mergedRecords = { ...this.dbService.getLocalRecords(), ...importedRecords };
          this.dbService.saveLocalRecords(mergedRecords);
          this.records = mergedRecords;

          if (importedCategories.length > 0) {
            this.settings = { ...this.settings, categories: importedCategories };
            this.dbService.saveLocalSettings(this.settings);
            this.applyCssVariables();
          }

          // Sync in background if enabled
          const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
          if (syncEnabled && supabaseUrl && supabaseAnonKey) {
            for (const key of Object.keys(importedRecords)) {
              try {
                await this.dbService.upsertRecord(supabaseUrl, supabaseAnonKey, importedRecords[key]);
              } catch (syncErr) {
                console.error('Failed to sync imported record:', key, syncErr);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed parsing imported JSON:', err);
      }
    };
    reader.readAsText(file);
  }

  getDateRangeText(): string {
    if (this.dates.length === 0) return '';
    const start = new Date(this.dates[0]);
    const end = new Date(this.dates[this.dates.length - 1]);
    
    const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endYear = end.getFullYear();

    return `${startStr} – ${endStr}, ${endYear}`;
  }

  // "Jump back to today" — used by the Today tab when it's showing a
  // non-today date opened from Week.
  handleReturnToToday(): void {
    this.selectedDate = this.todayDate;
  }
}
