import { DayRecord, ImpulseLogEntry } from '../types';
import { inferWakeHour } from './sleep';

export interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  /** The underlying mechanism, named explicitly (not just "try this"). */
  mechanism: string;
  /** KB section id this insight's mechanism is drawn from, e.g. "neurochemistry". */
  kbAnchor: string;
}

interface DayMetrics {
  sleepHours: number;
  movementMinutes: number;
  impulseCount: number;
  surfedCount: number;
  moodAvg: number | null;
  energyAvg: number | null;
  blocksCompleted: number;
  blocksPlanned: number;
  ritualsDone: number;
  wakeHour: number | null;
}

function computeDayMetrics(record: DayRecord | undefined, dateStr: string, impulsesByDate: Record<string, ImpulseLogEntry[]>): DayMetrics {
  const hours = record?.hours ?? [];
  const sleepHours = hours.filter(h => h === 'sleep').length;
  const movementMinutes = (record?.movementLog ?? []).reduce((sum, m) => sum + m.minutes, 0);

  const dayImpulses = impulsesByDate[dateStr] ?? [];
  const impulseCount = dayImpulses.length;
  const surfedCount = dayImpulses.filter(i => i.outcome === 'surfed').length;

  const checkIns = record?.moodEnergyCheckIns ?? [];
  const moodAvg = checkIns.length > 0 ? checkIns.reduce((s, c) => s + c.mood, 0) / checkIns.length : null;
  const energyAvg = checkIns.length > 0 ? checkIns.reduce((s, c) => s + c.energy, 0) / checkIns.length : null;

  const blocks = record?.plannedBlocks ?? [];
  const blocksCompleted = blocks.filter(b => b.done).length;
  const blocksPlanned = blocks.length;

  const ritualsDone = (record?.morningRitualDone ? 1 : 0) + (record?.eveningRitualDone ? 1 : 0);

  return {
    sleepHours,
    movementMinutes,
    impulseCount,
    surfedCount,
    moodAvg,
    energyAvg,
    blocksCompleted,
    blocksPlanned,
    ritualsDone,
    wakeHour: inferWakeHour(record)
  };
}

// Correlates sleep, exercise, impulses, mood, and block-completion across
// the given date range and returns the single most relevant insight — every
// insight names its mechanism and cites a KB section, replacing the old
// time-category-average-only rules. [step 39]
export function computeInsights(
  dates: string[],
  records: Record<string, DayRecord>,
  impulseEntries: ImpulseLogEntry[]
): Insight {
  const impulsesByDate: Record<string, ImpulseLogEntry[]> = {};
  impulseEntries.forEach((entry) => {
    (impulsesByDate[entry.date] ??= []).push(entry);
  });

  const daysWithData = dates.filter(d => records[d]);
  if (daysWithData.length === 0) {
    return {
      type: 'info',
      title: 'Start tracking',
      message: 'Paint some hours on Today to unlock personalized insights.',
      mechanism: 'Insights need at least a few days of real data to correlate against.',
      kbAnchor: 'definition'
    };
  }

  const perDay = daysWithData.map(d => computeDayMetrics(records[d], d, impulsesByDate));

  const avg = (nums: number[]): number => nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  const avgSleep = avg(perDay.map(m => m.sleepHours));
  const avgMovementMin = avg(perDay.map(m => m.movementMinutes));
  const totalImpulses = perDay.reduce((s, m) => s + m.impulseCount, 0);
  const totalSurfed = perDay.reduce((s, m) => s + m.surfedCount, 0);
  const avgImpulsesPerDay = totalImpulses / daysWithData.length;
  const moodValues = perDay.map(m => m.moodAvg).filter((m): m is number => m !== null);
  const avgMood = moodValues.length ? avg(moodValues) : null;
  const totalBlocksCompleted = perDay.reduce((s, m) => s + m.blocksCompleted, 0);
  const totalBlocksPlanned = perDay.reduce((s, m) => s + m.blocksPlanned, 0);
  const blockCompletionRate = totalBlocksPlanned > 0 ? totalBlocksCompleted / totalBlocksPlanned : null;
  const wakeHours = perDay.map(m => m.wakeHour).filter((h): h is number => h !== null);
  const wakeHourSpread = wakeHours.length >= 2 ? Math.max(...wakeHours) - Math.min(...wakeHours) : 0;

  // --- Correlation 1: low sleep + high impulses (a real cross-metric link,
  // not just "sleep is low") ---
  const lowSleepDays = perDay.filter(m => m.sleepHours > 0 && m.sleepHours < 6);
  const lowSleepImpulseAvg = avg(lowSleepDays.map(m => m.impulseCount));
  const normalSleepDays = perDay.filter(m => m.sleepHours >= 6);
  const normalSleepImpulseAvg = avg(normalSleepDays.map(m => m.impulseCount));
  if (lowSleepDays.length >= 2 && normalSleepDays.length >= 1 && lowSleepImpulseAvg > normalSleepImpulseAvg * 1.3) {
    return {
      type: 'warning',
      title: 'Short sleep tracks with more impulses',
      message: `On days with under 6h sleep you logged ${lowSleepImpulseAvg.toFixed(1)} impulses on average, vs ${normalSleepImpulseAvg.toFixed(1)} on better-rested days.`,
      mechanism: 'Sleep deprivation blunts prefrontal inhibitory control, so the urge-to-action gap narrows — impulses that would normally get caught don\'t.',
      kbAnchor: 'neurochemistry'
    };
  }

  // --- Correlation 2: movement day -> more completed blocks (post-exercise
  // catecholamine window actually paying off) ---
  const movementDays = perDay.filter(m => m.movementMinutes > 0);
  const noMovementDays = perDay.filter(m => m.movementMinutes === 0);
  if (movementDays.length >= 2 && noMovementDays.length >= 1) {
    const movementCompletionRate = movementDays.filter(m => m.blocksPlanned > 0).length > 0
      ? avg(movementDays.filter(m => m.blocksPlanned > 0).map(m => m.blocksCompleted / m.blocksPlanned))
      : null;
    const restCompletionRate = noMovementDays.filter(m => m.blocksPlanned > 0).length > 0
      ? avg(noMovementDays.filter(m => m.blocksPlanned > 0).map(m => m.blocksCompleted / m.blocksPlanned))
      : null;
    if (movementCompletionRate !== null && restCompletionRate !== null && movementCompletionRate > restCompletionRate * 1.15) {
      return {
        type: 'success',
        title: 'Movement days are your most productive days',
        message: `You complete ${Math.round(movementCompletionRate * 100)}% of planned blocks on days you moved, vs ${Math.round(restCompletionRate * 100)}% on days you didn't.`,
        mechanism: 'Exercise triggers a real catecholamine release — the same neurotransmitter family stimulant medication targets — opening a genuine focus window for roughly 90 minutes afterward.',
        kbAnchor: 'cheatcodes'
      };
    }
  }

  // --- Correlation 3: low mood correlates with day pattern ---
  if (avgMood !== null && avgMood <= 2.5 && avgSleep < 7) {
    return {
      type: 'warning',
      title: 'Low mood and short sleep are showing up together',
      message: `Average mood this period is ${avgMood.toFixed(1)}/5, alongside ${avgSleep.toFixed(1)}h average sleep.`,
      mechanism: 'Sleep loss disrupts dopamine receptor sensitivity and amygdala-prefrontal coupling — the same circuitry involved in mood regulation and emotional dysregulation.',
      kbAnchor: 'hormones'
    };
  }

  // --- Correlation 4: high urge-surf rate (things going right) ---
  if (totalImpulses >= 3 && totalSurfed / totalImpulses >= 0.5) {
    return {
      type: 'success',
      title: 'You\'re surfing more urges than you\'re acting on',
      message: `${totalSurfed} of ${totalImpulses} logged urges (${Math.round((totalSurfed / totalImpulses) * 100)}%) were surfed rather than acted on.`,
      mechanism: 'The urge-to-act gap is exactly what the 10-minute surf window trains — each surfed urge is a rep of the same inhibitory control circuit getting stronger.',
      kbAnchor: 'executive'
    };
  }

  // --- Correlation 5: high impulse frequency overall ---
  if (avgImpulsesPerDay > 2) {
    return {
      type: 'warning',
      title: 'Impulse frequency is elevated',
      message: `You're averaging ${avgImpulsesPerDay.toFixed(1)} logged urges per day.`,
      mechanism: 'Frequent low-effort dopamine hits (a fast scroll, a quick check) recalibrate what counts as "interesting," making slower, effortful tasks feel comparatively unbearable.',
      kbAnchor: 'modern'
    };
  }

  // --- Correlation 6: block completion rate is strong ---
  if (blockCompletionRate !== null && blockCompletionRate >= 0.7 && totalBlocksPlanned >= 3) {
    return {
      type: 'success',
      title: 'Your Now+Next blocks are landing',
      message: `You've completed ${totalBlocksCompleted} of ${totalBlocksPlanned} planned blocks (${Math.round(blockCompletionRate * 100)}%).`,
      mechanism: 'Implementation intentions ("At X I will Y") roughly double follow-through versus a plain intention, because the plan pre-commits the decision before willpower is needed.',
      kbAnchor: 'behavioural'
    };
  }

  // --- Correlation 7: wake time inconsistency ---
  if (wakeHourSpread >= 3) {
    return {
      type: 'warning',
      title: 'Wake time is drifting a lot day to day',
      message: `Your inferred wake times spanned about ${wakeHourSpread}h across the tracked days.`,
      mechanism: 'A shifting wake time repeatedly resets the circadian phase, so the body clock never fully entrains — this is a bigger driver of daytime attention trouble than total sleep duration alone.',
      kbAnchor: 'hormones'
    };
  }

  // --- Fallback: not enough signal for a specific correlation ---
  return {
    type: 'info',
    title: 'Building your picture',
    message: `${daysWithData.length} day(s) tracked so far — keep logging sleep, movement, and blocks to unlock sharper correlations.`,
    mechanism: 'Psychoeducation — understanding your own mechanism-level patterns — is itself an active ingredient in managing ADHD, not just a nice-to-know.',
    kbAnchor: 'behavioural'
  };
}
