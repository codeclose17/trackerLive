import { DayRecord } from '../types';

export interface BestDayAutopsy {
  date: string;
  score: number;
  reasons: string[];
}

// Scores a day by a simple, transparent composite: block-completion rate,
// morning ritual done, movement logged, sleep >= 6h, low impulse count.
// Not a hidden ML score — each point is named so the autopsy can explain
// itself. [step 40]
function scoreDay(record: DayRecord | undefined, impulseCountForDate: number): { score: number; reasons: string[] } {
  if (!record) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  const blocks = record.plannedBlocks ?? [];
  if (blocks.length > 0) {
    const rate = blocks.filter(b => b.done).length / blocks.length;
    if (rate >= 0.7) {
      score += 2;
      reasons.push('most planned blocks got done');
    }
  }

  if (record.morningRitualDone) {
    score += 1;
    reasons.push('started with the morning ritual');
  }

  if (record.eveningRitualDone) {
    score += 1;
    reasons.push('closed the day with the evening ritual');
  }

  const movementMinutes = (record.movementLog ?? []).reduce((s, m) => s + m.minutes, 0);
  if (movementMinutes > 0) {
    score += 1;
    reasons.push('had movement logged');
  }

  const sleepHours = record.hours.filter(h => h === 'sleep').length;
  if (sleepHours >= 6) {
    score += 1;
    reasons.push('got 6+ hours of sleep');
  }

  if (impulseCountForDate === 0) {
    score += 1;
    reasons.push('no impulses logged');
  }

  return { score, reasons };
}

// Finds the standout day in a set of dates and explains what made it work.
// Returns null if no day has any positive signal (nothing to autopsy yet).
export function computeBestDayAutopsy(
  dates: string[],
  records: Record<string, DayRecord>,
  impulseCountsByDate: Record<string, number>
): BestDayAutopsy | null {
  let best: BestDayAutopsy | null = null;

  dates.forEach((dateStr) => {
    const { score, reasons } = scoreDay(records[dateStr], impulseCountsByDate[dateStr] ?? 0);
    if (score > 0 && (best === null || score > best.score)) {
      best = { date: dateStr, score, reasons };
    }
  });

  return best;
}

// Sunday-only gate for the weekly review prompt. [step 40]
export function isReviewDay(date: Date = new Date()): boolean {
  return date.getDay() === 0;
}
