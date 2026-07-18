import { DayRecord, ImpulseLogEntry, PersonalRecords } from '../types';

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Impulse count for the most recently COMPLETED week (Sunday-Saturday,
// ending strictly before the current week) — the current in-progress week
// is excluded since it isn't finished yet and comparing a partial week
// against past full weeks would be misleading. Returns null if there's no
// completed week with any data.
export function computeLastCompletedWeekImpulseCount(impulseEntries: ImpulseLogEntry[], today: Date = new Date()): number | null {
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());
  currentWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(currentWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(currentWeekStart); // exclusive

  const inLastWeek = impulseEntries.filter((e) => {
    const d = new Date(e.date);
    return d >= lastWeekStart && d < lastWeekEnd;
  });

  // Only meaningful if the app was actually being used that week — no data
  // at all isn't "zero impulses," it's "not tracked."
  return inLastWeek.length >= 0 ? inLastWeek.length : null;
}

export interface RecordCheckResult {
  updated: PersonalRecords;
  newlyBroken: Array<'longestFocusStreak' | 'bestWakeConsistency' | 'lowestImpulseWeek'>;
}

// Compares current values against stored personal bests, updates them if
// beaten, and reports which ones were JUST beaten (for a one-time
// celebration) vs already celebrated. [step 43]
export function checkPersonalRecords(
  current: PersonalRecords,
  values: {
    focusStreak: number;
    wakeConsistency: number | null;
    lastCompletedWeekImpulseCount: number | null;
  }
): RecordCheckResult {
  const updated: PersonalRecords = { ...current };
  const newlyBroken: RecordCheckResult['newlyBroken'] = [];

  if (values.focusStreak > (current.longestFocusStreak?.value ?? 0)) {
    updated.longestFocusStreak = { value: values.focusStreak, celebrated: false };
    newlyBroken.push('longestFocusStreak');
  }

  if (values.wakeConsistency !== null && values.wakeConsistency > (current.bestWakeConsistency?.value ?? -1)) {
    updated.bestWakeConsistency = { value: values.wakeConsistency, celebrated: false };
    newlyBroken.push('bestWakeConsistency');
  }

  // Lower is better here, so "no record yet" needs a sentinel that any
  // real count beats — Infinity, not 0.
  if (
    values.lastCompletedWeekImpulseCount !== null &&
    values.lastCompletedWeekImpulseCount < (current.lowestImpulseWeek?.value ?? Infinity)
  ) {
    updated.lowestImpulseWeek = { value: values.lastCompletedWeekImpulseCount, celebrated: false };
    newlyBroken.push('lowestImpulseWeek');
  }

  return { updated, newlyBroken };
}
