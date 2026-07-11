import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { CategoryPickerComponent } from './components/category-picker/category-picker.component';
import { TrackerGridComponent } from './components/tracker-grid/tracker-grid.component';
import { StatsDashboardComponent } from './components/stats-dashboard/stats-dashboard.component';
import { SettingsModalComponent } from './components/settings-modal/settings-modal.component';
import { Category, DayRecord, Settings, SyncState } from './types';
import { DbService } from './services/db.service';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'sleep', name: 'Sleep', color: '#6366f1' },
  { id: 'work', name: 'Work', color: '#3b82f6' },
  { id: 'learn', name: 'Learn', color: '#10b981' },
  { id: 'social', name: 'Social Media', color: '#f43f5e' },
  { id: 'exercise', name: 'Exercise', color: '#f59e0b' },
  { id: 'idle', name: 'Idle / Uncategorized', color: '#27272a' }
];

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

const generateDateRange = (startDate: Date): string[] => {
  const dates: string[] = [];
  for (let i = 0; i < 14; i++) {
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
    TrackerGridComponent,
    StatsDashboardComponent,
    SettingsModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  startDate: Date = getStartOfWeekSunday(new Date());
  dates: string[] = generateDateRange(this.startDate);
  records: Record<string, DayRecord> = {};
  
  settings: Settings = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    syncEnabled: false,
    categories: DEFAULT_CATEGORIES
  };

  activeCategoryId = 'work';
  selectedDate: string = getLocalDateString(new Date());
  
  activeTab: 'grid' | 'stats' = 'grid';
  isSettingsOpen = false;
  syncState: SyncState = { status: 'idle' };

  private unsubscribeRealtime: () => void = () => {};

  constructor(private dbService: DbService) {}

  ngOnInit(): void {
    // Load local settings & records
    this.settings = this.dbService.getLocalSettings(DEFAULT_CATEGORIES);
    this.records = this.dbService.getLocalRecords();
    
    // Apply categories as CSS variables
    this.applyCssVariables();

    // Trigger initial sync
    this.initSync();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
    }
  }

  private applyCssVariables(): void {
    this.settings.categories.forEach((cat) => {
      document.documentElement.style.setProperty(`--color-${cat.id}`, cat.color);
    });
  }

  private async initSync(): Promise<void> {
    // Unsubscribe from previous realtime channel
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
    }

    const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
    if (!syncEnabled || !supabaseUrl || !supabaseAnonKey) {
      this.syncState = { status: 'idle' };
      return;
    }

    this.syncState = { status: 'syncing' };

    try {
      // Pull remote records
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

      if (hasChanges) {
        this.dbService.saveLocalRecords(mergedRecords);
        this.records = mergedRecords;
      }

      this.syncState = {
        status: 'success',
        lastSyncedAt: new Date().toLocaleTimeString()
      };

      // Set up real-time sync stream
      this.unsubscribeRealtime = this.dbService.subscribeToChanges(
        supabaseUrl,
        supabaseAnonKey,
        (updatedRecord) => {
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
        }
      );

    } catch (err: any) {
      console.error('Initial sync failed:', err);
      this.syncState = {
        status: 'error',
        errorMessage: err.message || 'Failed to sync with cloud database.'
      };
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

    // Sync in background if configured
    const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
    if (syncEnabled && supabaseUrl && supabaseAnonKey) {
      this.dbService.upsertRecord(supabaseUrl, supabaseAnonKey, updatedRecord)
        .then(() => {
          this.syncState = {
            status: 'success',
            lastSyncedAt: new Date().toLocaleTimeString()
          };
        })
        .catch((err) => {
          console.error('Failed to sync changes:', err);
          this.syncState = {
            status: 'error',
            errorMessage: 'Failed to sync modifications.'
          };
        });
    }
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

    // Sync in background if configured
    const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
    if (syncEnabled && supabaseUrl && supabaseAnonKey) {
      this.dbService.upsertRecord(supabaseUrl, supabaseAnonKey, updatedRecord)
        .then(() => {
          this.syncState = {
            status: 'success',
            lastSyncedAt: new Date().toLocaleTimeString()
          };
        })
        .catch((err) => {
          console.error('Failed to sync notes:', err);
          this.syncState = {
            status: 'error',
            errorMessage: 'Failed to sync reflections.'
          };
        });
    }
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
    const updatedCategories = [...activeCats, newCat, idleCat];
    
    this.settings = { ...this.settings, categories: updatedCategories };
    this.dbService.saveLocalSettings(this.settings);
    this.applyCssVariables();
  }

  handleUpdateCategory(updatedCat: Category): void {
    const updatedCategories = this.settings.categories.map((c) =>
      c.id === updatedCat.id ? updatedCat : c
    );
    this.settings = { ...this.settings, categories: updatedCategories };
    this.dbService.saveLocalSettings(this.settings);
    this.applyCssVariables();
  }

  handleDeleteCategory(catId: string): void {
    const updatedCategories = this.settings.categories.filter((c) => c.id !== catId);
    this.settings = { ...this.settings, categories: updatedCategories };
    this.dbService.saveLocalSettings(this.settings);

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
        const { supabaseUrl, supabaseAnonKey, syncEnabled } = this.settings;
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

  // Period shifting functions
  handlePrevPeriod(): void {
    const newStart = new Date(this.startDate);
    newStart.setDate(this.startDate.getDate() - 14);
    this.startDate = newStart;
    this.dates = generateDateRange(this.startDate);
  }

  handleNextPeriod(): void {
    const newStart = new Date(this.startDate);
    newStart.setDate(this.startDate.getDate() + 14);
    this.startDate = newStart;
    this.dates = generateDateRange(this.startDate);
  }

  handleResetPeriod(): void {
    this.startDate = getStartOfWeekSunday(new Date());
    this.dates = generateDateRange(this.startDate);
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
    a.download = `chronobox-backup-${getLocalDateString(new Date())}.json`;
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
}
