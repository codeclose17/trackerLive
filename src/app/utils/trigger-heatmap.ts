import { ImpulseLogEntry } from '../types';

export interface HeatmapCell {
  weekday: number; // 0=Sunday..6=Saturday
  hour: number;    // 0-23
  count: number;
}

// Builds an hour x weekday grid of impulse-log frequency. [step 42]
export function computeTriggerHeatmap(entries: ImpulseLogEntry[]): HeatmapCell[] {
  const counts: Record<string, number> = {};

  entries.forEach((entry) => {
    const date = new Date(entry.date);
    const weekday = date.getDay();
    const hour = new Date(entry.createdAt).getHours();
    const key = `${weekday}-${hour}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  const cells: HeatmapCell[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ weekday, hour, count: counts[`${weekday}-${hour}`] || 0 });
    }
  }
  return cells;
}

export function getHotCells(cells: HeatmapCell[], minCount = 2): HeatmapCell[] {
  return cells.filter(c => c.count >= minCount).sort((a, b) => b.count - a.count);
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
