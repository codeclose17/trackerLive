// XP curve: early levels come fast (small increments), later levels take
// progressively longer. Level N requires cumulative XP of N * (N + 3) * 5.
// L1->L2: 20xp, L2->L3: 30xp, L3->L4: 40xp ... L9->L10: 100xp, growing
// slowly after that — the first few levels land within a day or two of
// normal use, which is the point (frequent small dopamine hits, not a
// slog before the first payoff). [step 23]
export function xpForLevel(level: number): number {
  return level * (level + 3) * 5;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level) <= xp) {
    level++;
  }
  return level;
}

export function levelProgress(xp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number; percent: number } {
  const level = levelForXp(xp);
  const prevThreshold = level === 1 ? 0 : xpForLevel(level - 1);
  const nextThreshold = xpForLevel(level);
  const xpIntoLevel = xp - prevThreshold;
  const xpForNextLevel = nextThreshold - prevThreshold;
  const percent = Math.round((xpIntoLevel / xpForNextLevel) * 100);
  return { level, xpIntoLevel, xpForNextLevel, percent };
}

// XP award amounts by action type.
export const XP_AWARDS = {
  paintHour: 1,
  plannedBlockDone: 8,
  ritualDone: 10,
  instantWin: 5
} as const;
