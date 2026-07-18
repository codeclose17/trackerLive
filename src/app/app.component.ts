import { Component, OnInit, OnDestroy, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { InboxFabComponent } from './components/inbox-fab/inbox-fab.component';
import { TaskInboxComponent } from './components/task-inbox/task-inbox.component';
import { FocusTimerComponent } from './components/focus-timer/focus-timer.component';
import { RewardBankComponent } from './components/reward-bank/reward-bank.component';
import { LevelBadgeComponent } from './components/level-badge/level-badge.component';
import { StreakBadgeComponent } from './components/streak-badge/streak-badge.component';
import { WinLogComponent } from './components/win-log/win-log.component';
import { ImpulseLogComponent } from './components/impulse-log/impulse-log.component';
import { BoredomKitComponent } from './components/boredom-kit/boredom-kit.component';
import { SleepAnchorComponent } from './components/sleep-anchor/sleep-anchor.component';
import { BodyRegulatorsComponent } from './components/body-regulators/body-regulators.component';
import { OverwhelmSosComponent } from './components/overwhelm-sos/overwhelm-sos.component';
import { RsdFirstAidComponent } from './components/rsd-first-aid/rsd-first-aid.component';
import { MoodCheckinComponent } from './components/mood-checkin/mood-checkin.component';
import { RecordsBoardComponent } from './components/records-board/records-board.component';
import { KbPanelComponent } from './components/kb-panel/kb-panel.component';
import { DailyLessonCardComponent } from './components/daily-lesson-card/daily-lesson-card.component';
import {
  BoredomActivity, CaffeineEntry, Category, DayRecord, FrictionCard, ImpulseLogEntry, ImpulseTrigger,
  MovementEntry, MoodEnergyCheckIn, NotificationSettings, PersonalRecords, PlannedBlock, RewardBank,
  RsdEntry, Settings, SyncState, Task, WeeklyExperiment, WinLogEntry
} from './types';
import { HeatmapCell } from './utils/trigger-heatmap';
import { computeLastCompletedWeekImpulseCount, checkPersonalRecords } from './utils/personal-records';
import { DbService } from './services/db.service';
import { TaskService } from './services/task.service';
import { NotificationService } from './services/notification.service';
import { shouldFireWindDown, shouldFireHourlyLog, shouldFireBlockStart } from './utils/notification-triggers';
import { XP_AWARDS } from './utils/gamification';
import { computeStreak } from './utils/streak';
import { computeWakeConsistency } from './utils/sleep';

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
    FormsModule,
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
    HourlyQuickLogComponent,
    InboxFabComponent,
    TaskInboxComponent,
    FocusTimerComponent,
    RewardBankComponent,
    LevelBadgeComponent,
    StreakBadgeComponent,
    WinLogComponent,
    ImpulseLogComponent,
    BoredomKitComponent,
    SleepAnchorComponent,
    BodyRegulatorsComponent,
    OverwhelmSosComponent,
    RsdFirstAidComponent,
    MoodCheckinComponent,
    RecordsBoardComponent,
    KbPanelComponent,
    DailyLessonCardComponent
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


  records: Record<string, DayRecord> = {};

  settings: Settings = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    syncEnabled: false,
    categories: DEFAULT_CATEGORIES
  };

  activeCategoryId = 'work';
  selectedDate: string = getLocalDateString(new Date());

  activeTab: 'today' | 'week' | 'tasks' | 'stats' = 'today';
  tasks: Task[] = [];
  rewardBank: RewardBank = { minutesPerBlock: 5, bankedMinutes: 0 };
  wins: WinLogEntry[] = [];
  impulseEntries: ImpulseLogEntry[] = [];
  frictionCard: FrictionCard = { whyText: '' };
  boredomActivities: BoredomActivity[] = [];
  rsdEntries: RsdEntry[] = [];
  isSosOpen = false;
  kbPanelOpen = false;
  kbPanelChapterId: string | null = null;
  personalRecords: PersonalRecords = {};
  newlyBrokenRecords: string[] = [];
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

  // Caffeine cutoff (step 32): bedtime (wake target - 8h) minus 9h of
  // half-life buffer. Default wake 07:00 -> bedtime 23:00 -> cutoff 14:00,
  // matching the plan's stated default exactly.
  get caffeineCutoffHour(): number {
    const wake = this.settings.wakeTimeTarget || '07:00';
    const [h] = wake.split(':').map(Number);
    const bedtimeHour = (h - 8 + 24) % 24;
    return (bedtimeHour - 9 + 24) % 24;
  }

  // Hourly quick-log (step 11): prompts for the most recent past unlogged
  // hour of today, one at a time, dismissible.
  quickLogHourIndex: number | null = null;
  private dismissedQuickLogHours = new Set<number>();

  private unsubscribeRealtime: () => void = () => {};
  private unsubscribeCategoriesRealtime: () => void = () => {};
  private syncTimers: Record<string, any> = {};
  private notificationCheckTimer?: ReturnType<typeof setInterval>;

  constructor(
    private dbService: DbService,
    private taskService: TaskService,
    private notificationService: NotificationService,
    private zone: NgZone
  ) {}

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

    // Local-only data (steps 15-27, 34-37, 40, 43). Tasks/wins/impulses/RSD
    // entries are IndexedDB-backed (step 48) with an async migration/load
    // path — read the synchronous localStorage-seeded values immediately
    // for the very first paint, then reconcile once TaskService's async
    // load resolves so a second-or-later session doesn't briefly show
    // empty data while IndexedDB is still opening. reward bank / friction
    // card / boredom activities / personal records stay plain localStorage
    // (small, not high-write-frequency) and are safe to read synchronously.
    this.tasks = this.taskService.getTasks();
    this.rewardBank = this.taskService.getRewardBank();
    this.wins = this.taskService.getWinLog();
    this.impulseEntries = this.taskService.getImpulseLog();
    this.frictionCard = this.taskService.getFrictionCard();
    this.boredomActivities = this.taskService.getBoredomActivities();
    this.rsdEntries = this.taskService.getRsdEntries();
    this.personalRecords = this.taskService.getPersonalRecords();

    this.taskService.ready.then(() => {
      this.zone.run(() => {
        this.tasks = this.taskService.getTasks();
        this.wins = this.taskService.getWinLog();
        this.impulseEntries = this.taskService.getImpulseLog();
        this.rsdEntries = this.taskService.getRsdEntries();
        this.refreshPersonalRecords();
      });
    });

    // Check records once after everything's loaded. Also re-checked after
    // any mutation that could plausibly move one of these three metrics
    // (see refreshPersonalRecords() call sites below) rather than on a
    // timer or every change-detection cycle.
    this.refreshPersonalRecords();

    // Notifications (step 46): reflect whatever permission the browser
    // already granted/denied previously (don't re-prompt), and start the
    // periodic trigger check. Runs outside Angular's zone so a 30s tick
    // doesn't force a change-detection pass across the whole app.
    this.notificationPermission = this.notificationService.permission;
    this.zone.runOutsideAngular(() => {
      this.notificationCheckTimer = setInterval(() => this.checkNotificationTriggers(), 30_000);
    });
  }

  // ---- Records board (step 43) ----
  refreshPersonalRecords(): void {
    const lastCompletedWeekImpulseCount = computeLastCompletedWeekImpulseCount(this.impulseEntries);
    const { updated, newlyBroken } = checkPersonalRecords(this.personalRecords, {
      focusStreak: this.streak.streakDays,
      wakeConsistency: this.wakeConsistency.daysWithData > 0 ? this.wakeConsistency.score : null,
      lastCompletedWeekImpulseCount
    });

    if (newlyBroken.length > 0) {
      this.personalRecords = updated;
      this.taskService.savePersonalRecords(updated);
      this.newlyBrokenRecords = [...this.newlyBrokenRecords, ...newlyBroken];
    }
  }

  dismissRecordCelebration(): void {
    // Mark whatever was just celebrated as seen, so it won't re-celebrate
    // on the next refresh.
    const updated: PersonalRecords = { ...this.personalRecords };
    this.newlyBrokenRecords.forEach((key) => {
      const k = key as keyof PersonalRecords;
      if (updated[k]) {
        updated[k] = { ...updated[k]!, celebrated: true };
      }
    });
    this.personalRecords = updated;
    this.taskService.savePersonalRecords(updated);
    this.newlyBrokenRecords = [];
  }

  // ---- Overwhelm SOS (step 35) ----
  get sosSmallestNextAction(): string | null {
    const record = this.records[this.todayDate];
    const blocks = (record?.plannedBlocks || []).filter(b => !b.done);
    if (blocks.length === 0) return null;
    const next = [...blocks].sort((a, b) => a.time.localeCompare(b.time))[0];
    return next.action;
  }

  handleOpenSos(): void {
    this.isSosOpen = true;
    // Logged privately: a plain counter on today's record, not surfaced in
    // any social/shared view — same privacy bar as the RSD entries.
    const record = this.records[this.todayDate];
    this.updateTodayField({ sosUsageCount: (record?.sosUsageCount || 0) + 1 });
  }

  handleExitSos(): void {
    this.isSosOpen = false;
  }

  // ---- RSD first-aid (step 36) ----
  handleSaveRsdEntry(entry: { whatHappened: string; storyImTellingMyself: string; kinderRead: string }): void {
    const newEntry: RsdEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...entry,
      createdAt: new Date().toISOString()
    };
    this.rsdEntries = [...this.rsdEntries, newEntry];
    this.taskService.saveRsdEntries(this.rsdEntries);
  }

  handleDeleteRsdEntry(id: string): void {
    this.rsdEntries = this.rsdEntries.filter(e => e.id !== id);
    this.taskService.saveRsdEntries(this.rsdEntries);
  }

  // ---- Mood/energy check-ins (step 37) ----
  get moodCheckInsToday(): MoodEnergyCheckIn[] {
    return this.records[this.todayDate]?.moodEnergyCheckIns || [];
  }

  handleMoodCheckIn(event: { mood: number; energy: number }): void {
    const record = this.records[this.todayDate];
    const existing = record?.moodEnergyCheckIns || [];
    if (existing.length >= 3) return; // hard cap, enforced here too
    const entry: MoodEnergyCheckIn = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      mood: event.mood,
      energy: event.energy,
      loggedAt: new Date().toISOString()
    };
    this.updateTodayField({ moodEnergyCheckIns: [...existing, entry] });

    // Step 24: low mood resurfaces 3 past wins.
    if (event.mood <= 2) {
      this.resurfaceWinsForLowMood();
    }
  }

  private resurfaceWinsForLowMood(): void {
    const recent = [...this.wins].reverse().slice(0, 3);
    this.resurfacedWins = recent;
  }

  resurfacedWins: WinLogEntry[] = [];

  dismissResurfacedWins(): void {
    this.resurfacedWins = [];
  }

  // ---- Impulse log + friction cards (steps 25, 26) ----
  get impulseEntriesToday(): ImpulseLogEntry[] {
    return this.impulseEntries.filter(e => e.date === this.todayDate);
  }

  handleLogImpulse(event: { trigger: ImpulseTrigger; outcome: 'acted' | 'surfed' }): void {
    const entry: ImpulseLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: this.todayDate,
      trigger: event.trigger,
      outcome: event.outcome,
      createdAt: new Date().toISOString()
    };
    this.impulseEntries = [...this.impulseEntries, entry];
    this.taskService.appendImpulseEntry(entry);

    // Surfed urges are celebrated: a small XP award + a win-log entry, same
    // "small frequent reward" pattern as the rest of the dopamine layer.
    if (event.outcome === 'surfed') {
      this.awardXp(3);
      this.appendWin(`Surfed a ${event.trigger} urge instead of acting on it`, 'instant-win');
    }

    // Keep the legacy bingeCount tally in sync (Supabase schema still has
    // this column) so existing stats/sync keep working without a breaking
    // schema change — see step 25 evidence for the reasoning.
    if (event.outcome === 'acted') {
      const existing = this.getOrCreateTodayRecord();
      const updated: DayRecord = {
        ...existing,
        bingeCount: (existing.bingeCount || 0) + 1,
        updatedAt: new Date().toISOString()
      };
      this.records = { ...this.records, [this.todayDate]: updated };
      this.dbService.saveLocalRecords(this.records);
      this.queueSupabaseSync(this.todayDate);
    }

    // Impulse count can move the lowest-impulse-week record (step 43).
    this.refreshPersonalRecords();
  }

  // ---- Boredom kit (step 27) ----
  handleBoredomActivityPicked(activity: BoredomActivity): void {
    this.appendWin(`Beat boredom with: ${activity.text}`, 'instant-win');
    this.awardXp(2);
  }

  handleSaveSafetyNet(frictionWhyText: string, boredomActivities: BoredomActivity[]): void {
    this.frictionCard = { whyText: frictionWhyText };
    this.taskService.saveFrictionCard(this.frictionCard);
    this.boredomActivities = boredomActivities;
    this.taskService.saveBoredomActivities(boredomActivities);
  }

  // ---- Body regulators (steps 28-33) ----
  handleWakeTimeTargetChange(time: string): void {
    this.settings = { ...this.settings, wakeTimeTarget: time };
    this.dbService.saveLocalSettings(this.settings);
  }

  get wakeConsistency() {
    return computeWakeConsistency(this.weekDates, this.records, this.wakeTimeTargetHour);
  }

  private get wakeTimeTargetHour(): number {
    const wake = this.settings.wakeTimeTarget || '07:00';
    return parseInt(wake.split(':')[0], 10);
  }

  get morningLightStreak(): number {
    let streak = 0;
    let cursor = new Date();
    for (let i = 0; i < 60; i++) {
      const y = cursor.getFullYear();
      const m = (cursor.getMonth() + 1).toString().padStart(2, '0');
      const d = cursor.getDate().toString().padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const record = this.records[dateStr];
      if (record?.morningLightDone) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  private updateTodayField(patch: Partial<DayRecord>): void {
    const existing = this.getOrCreateTodayRecord();
    const updated: DayRecord = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.records = { ...this.records, [this.todayDate]: updated };
    this.dbService.saveLocalRecords(this.records);
    this.queueSupabaseSync(this.todayDate);
  }

  // Deep-links a "why this works" microcopy link into the native KB panel
  // (step 44 — this replaced the iframe-scroll stopgap built for step 29).
  openKbSection(anchorId: string): void {
    this.kbPanelOpen = true;
    this.kbPanelChapterId = anchorId;
  }

  handleToggleMorningLight(): void {
    const record = this.records[this.todayDate];
    const next = !record?.morningLightDone;
    this.updateTodayField({ morningLightDone: next });
    if (next) {
      this.awardXp(2);
    }
  }

  handleToggleProteinBreakfast(): void {
    const record = this.records[this.todayDate];
    this.updateTodayField({ proteinBreakfastDone: !record?.proteinBreakfastDone });
  }

  handleAddMovement(event: { type: string; minutes: number }): void {
    const record = this.records[this.todayDate];
    const entry: MovementEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: event.type,
      minutes: event.minutes,
      loggedAt: new Date().toISOString()
    };
    this.updateTodayField({ movementLog: [...(record?.movementLog || []), entry] });
    this.awardXp(3);
    this.appendWin(`Moved: ${event.type} (${event.minutes} min)`, 'instant-win');
  }

  handleAddCaffeine(): void {
    const record = this.records[this.todayDate];
    const entry: CaffeineEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      loggedAt: new Date().toISOString()
    };
    this.updateTodayField({ caffeineLog: [...(record?.caffeineLog || []), entry] });
  }

  handleIncrementStressReset(): void {
    const record = this.records[this.todayDate];
    this.updateTodayField({ stressResetCount: (record?.stressResetCount || 0) + 1 });
    this.awardXp(2);
  }

  handleToggleColdExposure(): void {
    const record = this.records[this.todayDate];
    this.updateTodayField({ coldExposureDone: !record?.coldExposureDone });
  }

  // ---- Cycle-aware mode, opt-in only (step 34) ----
  handleSetCycleDay(day: number | null): void {
    this.updateTodayField({ cycleDay: day ?? undefined });
  }

  // ---- Trigger heatmap pre-commit (step 42) ----
  // Finds the next occurrence of the hot cell's weekday (today if it
  // matches) and adds a pre-commit block there at that hour — turning "you
  // tend to slip at Tue 15:00" into a concrete scheduled block.
  handlePreCommitFromHeatmap(cell: HeatmapCell): void {
    const today = new Date();
    const daysUntil = (cell.weekday - today.getDay() + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    const targetDateStr = getLocalDateString(targetDate);

    const existing = this.records[targetDateStr] || {
      date: targetDateStr,
      hours: Array(24).fill('idle'),
      notes: '',
      updatedAt: new Date().toISOString()
    };
    const currentBlocks = existing.plannedBlocks || [];
    if (currentBlocks.length >= 3) return; // respects the planner's own cap

    const newBlock: PlannedBlock = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      time: `${cell.hour.toString().padStart(2, '0')}:00`,
      action: 'do something intentional instead',
      place: '',
      done: false
    };

    const updated: DayRecord = {
      ...existing,
      plannedBlocks: [...currentBlocks, newBlock],
      updatedAt: new Date().toISOString()
    };
    this.records = { ...this.records, [targetDateStr]: updated };
    this.dbService.saveLocalRecords(this.records);
    this.queueSupabaseSync(targetDateStr);

    if (daysUntil === 0) {
      this.activeTab = 'today';
      this.selectedDate = this.todayDate;
    }
  }

  // ---- Weekly review (step 40) ----
  handleSaveExperiment(event: WeeklyExperiment): void {
    this.settings = { ...this.settings, activeExperiment: event };
    this.dbService.saveLocalSettings(this.settings);
  }

  // Pinned "all week" — stays visible on Today until 7 days after the
  // Sunday it was chosen for have elapsed, then quietly retires so a stale
  // experiment doesn't linger forever.
  get activeExperimentIfCurrent(): WeeklyExperiment | null {
    const exp = this.settings.activeExperiment;
    if (!exp) return null;
    const weekStart = new Date(exp.weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return new Date() < weekEnd ? exp : null;
  }

  // ---- XP & levels (step 23) ----
  // Stored on Settings.gamification so it rides the existing Supabase sync
  // path and localStorage save — "XP persists and syncs with records"
  // without a second sync pipeline.
  get xp(): number {
    return this.settings.gamification?.xp || 0;
  }

  private awardXp(amount: number): void {
    const nextXp = this.xp + amount;
    this.settings = { ...this.settings, gamification: { xp: nextXp } };
    this.dbService.saveLocalSettings(this.settings);
  }

  // ---- Streak (step 22) ----
  get streak() {
    return computeStreak(this.records);
  }

  // ---- Win log (step 24) ----
  private appendWin(text: string, source: WinLogEntry['source']): void {
    const entry: WinLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      createdAt: new Date().toISOString(),
      source
    };
    this.wins = [...this.wins, entry];
    this.taskService.appendWinEntry(entry);
  }

  handleAddManualWin(text: string): void {
    this.appendWin(text, 'manual');
  }

  // ---- Focus timer + temptation bundling (steps 18, 20) ----
  handleFocusBlockCompleted(): void {
    const next: RewardBank = {
      ...this.rewardBank,
      bankedMinutes: this.rewardBank.bankedMinutes + this.rewardBank.minutesPerBlock
    };
    this.rewardBank = next;
    this.taskService.saveRewardBank(next);
  }

  handleRewardBankChange(bank: RewardBank): void {
    this.rewardBank = bank;
    this.taskService.saveRewardBank(bank);
  }

  handleRewardSpent(minutes: number): void {
    // Logged as an evening-reflection-style note for now — a full spend log
    // is Phase D territory (step 24 win log); this satisfies "spending logs
    // it" without building a whole ledger ahead of schedule.
    const existing = this.getOrCreateTodayRecord();
    const spendNote = `Spent ${minutes} banked reward min${minutes === 1 ? '' : 's'} on: ${this.rewardBank.rewardActivity || 'reward'}`;
    const updated: DayRecord = {
      ...existing,
      notes: existing.notes ? `${existing.notes}\n${spendNote}` : spendNote,
      updatedAt: new Date().toISOString()
    };
    this.records = { ...this.records, [this.todayDate]: updated };
    this.dbService.saveLocalRecords(this.records);
    this.queueSupabaseSync(this.todayDate);
  }

  handleThoughtParked(text: string): void {
    this.handleCaptureTask(text);
  }

  // ---- Brain-dump inbox + task shredder (steps 15-17, 19, 21) ----
  handleCaptureTask(text: string): void {
    const newTask: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      done: false
    };
    this.tasks = [newTask, ...this.tasks];
    this.taskService.saveTasks(this.tasks);
  }

  handleTasksChange(tasks: Task[]): void {
    this.tasks = tasks;
    this.taskService.saveTasks(tasks);
  }

  get twoMinuteTasks(): Task[] {
    return this.tasks.filter(t => t.isTwoMinuteTask && !t.done);
  }

  // Step 21: backwards milestones due on the date currently shown on Today.
  get milestonesDueToday(): Task[] {
    return this.tasks.filter(t => t.isMilestone && !t.done && t.dueDate === this.selectedDate);
  }

  handleMilestoneDone(taskId: string): void {
    const next = this.tasks.map(t => t.id === taskId ? { ...t, done: true, doneAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : t);
    this.handleTasksChange(next);
  }

  // A task can only reach this handler once it has been shredded — the
  // "Schedule" button in task-inbox.component.ts is only rendered when
  // task.firstAction is set, so the gate is enforced in the UI, not just
  // documented (step 16).
  handleScheduleTask(task: Task): void {
    if (!task.firstAction) return; // defensive: enforce the gate here too
    const now = new Date();
    const inFifteen = new Date(now.getTime() + 15 * 60000);
    const time = `${inFifteen.getHours().toString().padStart(2, '0')}:${inFifteen.getMinutes().toString().padStart(2, '0')}`;

    const newBlock: PlannedBlock = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      time,
      action: task.firstAction,
      place: '',
      done: false
    };

    const existing = this.getOrCreateTodayRecord();
    const currentBlocks = existing.plannedBlocks || [];
    if (currentBlocks.length >= 3) return; // planner's own 3-block cap (step 12)

    const updated: DayRecord = {
      ...existing,
      plannedBlocks: [...currentBlocks, newBlock],
      updatedAt: new Date().toISOString()
    };
    this.records = { ...this.records, [this.todayDate]: updated };
    this.dbService.saveLocalRecords(this.records);
    this.queueSupabaseSync(this.todayDate);

    this.activeTab = 'today';
    this.selectedDate = this.todayDate;
  }

  handleCompleteTwoMinuteTask(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    const next = this.tasks.map(t => t.id === taskId ? { ...t, done: true, doneAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : t);
    this.handleTasksChange(next);

    this.awardXp(XP_AWARDS.instantWin);
    if (task) {
      this.appendWin(`Instant win: ${task.text}`, 'instant-win');
    }
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

    this.awardXp(XP_AWARDS.ritualDone);
    this.appendWin('Started the day with the morning ritual', 'ritual');
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

    this.awardXp(XP_AWARDS.ritualDone);
    this.appendWin('Closed the day with the evening ritual', 'ritual');

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

    // Detect a not-done -> done transition (not add/remove/edit) so XP and
    // the win log only fire on genuine completions.
    const prevBlocks = existing.plannedBlocks || [];
    const newlyDoneBlocks = blocks.filter(b => b.done && !prevBlocks.find(p => p.id === b.id)?.done);

    const updated: DayRecord = {
      ...existing,
      plannedBlocks: blocks.slice(0, 3),
      updatedAt: new Date().toISOString()
    };
    this.records = { ...this.records, [dateStr]: updated };
    this.dbService.saveLocalRecords(this.records);

    newlyDoneBlocks.forEach(block => {
      this.awardXp(XP_AWARDS.plannedBlockDone);
      this.appendWin(`Did it: ${block.action}`, 'block');
    });
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
    if (this.notificationCheckTimer) {
      clearInterval(this.notificationCheckTimer);
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
    // No separate KB theme sync needed (step 44): the KB is now rendered
    // natively inside the app's own DOM, sharing the app's data-theme
    // attribute and token sheet directly — there's nothing else to sync.
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
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
      this.unsubscribeCategoriesRealtime = await this.dbService.subscribeToCategoryChanges(
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
      this.unsubscribeRealtime = await this.dbService.subscribeToChanges(
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

    // Small XP only for genuinely newly-categorized hours (idle -> category),
    // not every paint stroke — dragging across an already-painted row or
    // erasing shouldn't farm XP.
    const wasIdle = existingRecord.hours[hourIndex] === 'idle';
    if (wasIdle && categoryId !== 'idle') {
      this.awardXp(XP_AWARDS.paintHour);
    }

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

    // Painting can move the streak (step 22) or wake-consistency (step 28)
    // metrics, both of which feed the records board.
    this.refreshPersonalRecords();

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

  // Save Settings Modal
  handleSaveSettings(newSyncSettings: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    syncEnabled: boolean;
    frictionWhyText: string;
    boredomActivities: BoredomActivity[];
    cycleAwareModeEnabled: boolean;
    notifications: NotificationSettings;
  }): void {
    this.settings = {
      ...this.settings,
      supabaseUrl: newSyncSettings.supabaseUrl,
      supabaseAnonKey: newSyncSettings.supabaseAnonKey,
      syncEnabled: newSyncSettings.syncEnabled,
      cycleAwareModeEnabled: newSyncSettings.cycleAwareModeEnabled,
      notifications: newSyncSettings.notifications
    };
    this.dbService.saveLocalSettings(this.settings);
    this.handleSaveSafetyNet(newSyncSettings.frictionWhyText, newSyncSettings.boredomActivities);
    this.isSettingsOpen = false;

    // Trigger sync restart
    this.initSync();
  }

  // ---- Notifications (step 46) ----
  notificationPermission: NotificationPermission | 'unsupported' = 'default';

  async handleRequestNotificationPermission(): Promise<void> {
    // Must run directly inside this click-triggered handler — browsers
    // reject permission requests not called from a user gesture.
    const result = await this.notificationService.requestPermission();
    this.notificationPermission = result;
  }

  private notifiedThisMinuteKey = '';

  // Runs on a periodic timer (see ngOnInit) while the app is open. This is
  // an honest constraint of a client-only PWA with no push server:
  // notifications can only fire while the app/browser is running, not
  // truly in the background when fully closed.
  private checkNotificationTriggers(): void {
    const notif = this.settings.notifications;
    if (!notif || this.notificationPermission !== 'granted') return;

    const now = new Date();
    const minuteKey = `${now.getHours()}:${now.getMinutes()}`;
    if (minuteKey === this.notifiedThisMinuteKey) return; // avoid double-firing within the same minute
    this.notifiedThisMinuteKey = minuteKey;

    if (shouldFireWindDown(notif, `${this.eveningRitualHour.toString().padStart(2, '0')}:00`, now)) {
      this.notificationService.show('Wind-down time', 'Time to start easing into the evening ritual.', 'wind-down');
    }

    if (shouldFireHourlyLog(notif, now)) {
      this.notificationService.show('Quick log', 'What did the last hour look like?', 'hourly-log');
    }

    const blockCheck = shouldFireBlockStart(notif, this.records[this.todayDate], now);
    if (blockCheck.fire && blockCheck.action) {
      this.notificationService.show('Block starting now', blockCheck.action, 'block-start');
    }
  }

  handleHyperfocusGuardTriggered(): void {
    if (this.settings.notifications?.hyperfocusGuard && this.notificationPermission === 'granted') {
      this.notificationService.show('90 minutes straight', 'Time to stand up and take a break.', 'hyperfocus-guard');
    }
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
    // Every locally-stored piece of user data, not just records/categories
    // — step 47 explicitly requires "export includes everything." Settings
    // (categories, gamification, wakeTimeTarget, notifications, etc.) is
    // included wholesale since it's already the full Settings shape.
    const localData = {
      exportVersion: 1,
      records: this.dbService.getLocalRecords(),
      settings: this.settings,
      tasks: this.taskService.getTasks(),
      rewardBank: this.taskService.getRewardBank(),
      winLog: this.taskService.getWinLog(),
      impulseLog: this.taskService.getImpulseLog(),
      frictionCard: this.taskService.getFrictionCard(),
      boredomActivities: this.taskService.getBoredomActivities(),
      rsdEntries: this.taskService.getRsdEntries(),
      personalRecords: this.taskService.getPersonalRecords(),
      // Kept for backward compatibility with older exported backups that
      // only had these two top-level keys (see handleImportData).
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
          // Backward-compatible: old backups (pre step-47) only had a
          // top-level `categories` key; newer ones nest it under `settings`.
          const importedCategories = parsed.settings?.categories || parsed.categories || [];

          const mergedRecords = { ...this.dbService.getLocalRecords(), ...importedRecords };
          this.dbService.saveLocalRecords(mergedRecords);
          this.records = mergedRecords;

          if (importedCategories.length > 0) {
            this.settings = { ...this.settings, categories: importedCategories };
          }
          // Merge in the rest of settings (gamification, wakeTimeTarget,
          // notifications, etc.) if present — absent on old backups, so
          // nothing breaks importing them.
          if (parsed.settings) {
            this.settings = {
              ...this.settings,
              ...parsed.settings,
              // Never import Supabase credentials from a backup file — the
              // importing device keeps its own connection settings.
              supabaseUrl: this.settings.supabaseUrl,
              supabaseAnonKey: this.settings.supabaseAnonKey,
              syncEnabled: this.settings.syncEnabled,
              categories: importedCategories.length > 0 ? importedCategories : this.settings.categories
            };
          }
          this.dbService.saveLocalSettings(this.settings);
          this.applyCssVariables();

          // Local-only data (steps 15-27, 34-37, 40, 43 — kept intentionally
          // local per this build's design, see step 47 evidence) — merge in
          // whatever the backup has, imported data doesn't overwrite newer
          // local entries with the same id.
          const mergeById = <T extends { id: string }>(local: T[], imported: T[] | undefined): T[] => {
            if (!imported || imported.length === 0) return local;
            const localIds = new Set(local.map(x => x.id));
            return [...local, ...imported.filter(x => !localIds.has(x.id))];
          };

          if (parsed.tasks) {
            this.tasks = mergeById(this.tasks, parsed.tasks);
            this.taskService.saveTasks(this.tasks);
          }
          if (parsed.winLog) {
            this.wins = mergeById(this.wins, parsed.winLog);
            this.taskService.saveWinLog(this.wins);
          }
          if (parsed.impulseLog) {
            this.impulseEntries = mergeById(this.impulseEntries, parsed.impulseLog);
            this.taskService.saveImpulseLog(this.impulseEntries);
          }
          if (parsed.rsdEntries) {
            this.rsdEntries = mergeById(this.rsdEntries, parsed.rsdEntries);
            this.taskService.saveRsdEntries(this.rsdEntries);
          }
          if (parsed.frictionCard) {
            this.frictionCard = parsed.frictionCard;
            this.taskService.saveFrictionCard(this.frictionCard);
          }
          if (parsed.boredomActivities) {
            this.boredomActivities = mergeById(this.boredomActivities, parsed.boredomActivities);
            this.taskService.saveBoredomActivities(this.boredomActivities);
          }
          if (parsed.rewardBank) {
            this.rewardBank = parsed.rewardBank;
            this.taskService.saveRewardBank(this.rewardBank);
          }
          // Personal records: only adopt an imported record if it's
          // actually better than the local one, same rule checkPersonalRecords
          // itself uses — an import should never silently downgrade a record.
          if (parsed.personalRecords) {
            const { updated } = checkPersonalRecords(this.personalRecords, {
              focusStreak: parsed.personalRecords.longestFocusStreak?.value ?? 0,
              wakeConsistency: parsed.personalRecords.bestWakeConsistency?.value ?? null,
              lastCompletedWeekImpulseCount: parsed.personalRecords.lowestImpulseWeek?.value ?? null
            });
            this.personalRecords = updated;
            this.taskService.savePersonalRecords(this.personalRecords);
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
