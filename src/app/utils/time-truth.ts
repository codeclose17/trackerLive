import { DayRecord } from '../types';

// A non-shaming sentence describing how planned time compared to actual
// painted time across a week, framed as a trade-off observation, never a
// failure. [step 41]
export function computeWeeklyTradeSummary(dates: string[], records: Record<string, DayRecord>, categories: { id: string; name: string }[]): string | null {
  const hourCounts: Record<string, number> = {};
  let totalPlannedBlocks = 0;
  let totalCompletedBlocks = 0;
  let anyData = false;

  dates.forEach((dateStr) => {
    const record = records[dateStr];
    if (!record) return;
    anyData = true;
    record.hours.forEach((catId) => {
      hourCounts[catId] = (hourCounts[catId] || 0) + 1;
    });
    const blocks = record.plannedBlocks || [];
    totalPlannedBlocks += blocks.length;
    totalCompletedBlocks += blocks.filter(b => b.done).length;
  });

  if (!anyData) return null;

  // Find the two categories with the biggest gap in hours (excluding idle)
  // — this is the "trade" being made, described neutrally.
  const nonIdle = categories.filter(c => c.id !== 'idle');
  const sorted = nonIdle
    .map(c => ({ name: c.name, hours: hourCounts[c.id] || 0 }))
    .filter(c => c.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  const blockRate = totalPlannedBlocks > 0 ? Math.round((totalCompletedBlocks / totalPlannedBlocks) * 100) : null;

  if (sorted.length >= 2) {
    const top = sorted[0];
    const second = sorted[1];
    const blockClause = blockRate !== null
      ? ` You also completed ${totalCompletedBlocks} of ${totalPlannedBlocks} planned blocks (${blockRate}%) — worth noticing, not judging.`
      : '';
    return `This week traded ${second.hours}h of ${second.name} for ${top.hours}h of ${top.name}. That's information, not a verdict.${blockClause}`;
  }

  if (blockRate !== null) {
    return `You completed ${totalCompletedBlocks} of ${totalPlannedBlocks} planned blocks this week (${blockRate}%) — a data point for next week's experiment, not a scorecard.`;
  }

  return null;
}
