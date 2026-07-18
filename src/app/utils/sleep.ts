import { DayRecord } from '../types';

const SLEEP_CATEGORY_ID = 'sleep';

// Infer the "wake hour" for a day from painted Sleep hours: the hour right
// after the last consecutive sleep-tagged block that runs through or
// touches the morning (hours 0-11). Returns null if there's no sleep data
// for that day (nothing to score). [step 28]
export function inferWakeHour(record: DayRecord | undefined): number | null {
  if (!record) return null;
  const hours = record.hours;

  // Walk hours 0..11 looking for the last sleep hour, then the wake hour
  // is the following one (still asleep at 6, awake by 7 -> wake hour 7).
  let lastSleepHour: number | null = null;
  for (let h = 0; h <= 11; h++) {
    if (hours[h] === SLEEP_CATEGORY_ID) {
      lastSleepHour = h;
    }
  }
  if (lastSleepHour === null) return null;
  return Math.min(lastSleepHour + 1, 23);
}

export interface WakeConsistencyResult {
  /** 0-100. Higher = wake times cluster tightly around the target. */
  score: number;
  daysWithData: number;
}

// Consistency score: for each day with inferable wake data, measure the
// deviation (in hours) from the target wake time; average the deviations
// and convert to a 0-100 score (0 deviation = 100, >=4h average deviation
// = 0). Rewards a stable rhythm, not just "woke up early enough". [step 28]
export function computeWakeConsistency(
  dates: string[],
  records: Record<string, DayRecord>,
  targetWakeHour: number
): WakeConsistencyResult {
  const deviations: number[] = [];

  dates.forEach((dateStr) => {
    const wakeHour = inferWakeHour(records[dateStr]);
    if (wakeHour === null) return;
    deviations.push(Math.abs(wakeHour - targetWakeHour));
  });

  if (deviations.length === 0) {
    return { score: 0, daysWithData: 0 };
  }

  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const score = Math.max(0, Math.round(100 - (avgDeviation / 4) * 100));
  return { score, daysWithData: deviations.length };
}
