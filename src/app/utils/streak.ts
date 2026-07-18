import { DayRecord } from '../types';

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isEngaged = (record: DayRecord | undefined): boolean => {
  if (!record) return false;
  const hasPaintedHours = record.hours.some(h => h !== 'idle');
  const hasNotes = !!record.notes?.trim();
  const hasRitual = !!record.morningRitualDone || !!record.eveningRitualDone;
  return hasPaintedHours || hasNotes || hasRitual;
};

export interface StreakResult {
  streakDays: number;
  /** true if the most recent gap in the streak was exactly one day (dims,
   * doesn't reset) — drives the "never miss twice" nudge. */
  isDimmedByOneMiss: boolean;
}

// "Days engaged" streak, walking backward from today. A single missed day
// dims the streak (doesn't reset it) so one bad day doesn't erase weeks of
// progress and trigger the abandon-the-whole-thing spiral; two consecutive
// missed days does end it. [step 22]
//
// Key design point: a streak's natural boundary (the day before the user
// started, or before their very first engaged day) must NOT be treated as
// a "miss" — only a gap that has an engaged day on both sides counts.
// This is checked by looking one day further back before spending the
// dim-tolerance: only spend it if there's more engaged history past the
// gap to justify calling it a "miss" rather than just where the data ends.
export function computeStreak(records: Record<string, DayRecord>, today: Date = new Date()): StreakResult {
  let streakDays = 0;
  let isDimmedByOneMiss = false;
  let cursor = new Date(today);
  const todayStr = getLocalDateString(today);

  for (let i = 0; i < 3650; i++) { // hard cap so a corrupt/huge dataset can't loop forever
    const dateStr = getLocalDateString(cursor);
    const record = records[dateStr];

    if (isEngaged(record)) {
      streakDays++;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    // Today not yet engaged (app just opened) doesn't count as a miss or
    // end the streak — skip it and keep looking backward.
    if (dateStr === todayStr) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    // Not engaged, and not today. Only worth tolerating as a single-day
    // "miss" (rather than the natural end of history) if there is an
    // engaged day immediately behind this gap to resume the streak with.
    if (!isDimmedByOneMiss && streakDays > 0) {
      const dayBeforeGap = new Date(cursor);
      dayBeforeGap.setDate(cursor.getDate() - 1);
      const recordBeforeGap = records[getLocalDateString(dayBeforeGap)];
      if (isEngaged(recordBeforeGap)) {
        isDimmedByOneMiss = true;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
    }

    break;
  }

  return { streakDays, isDimmedByOneMiss };
}
