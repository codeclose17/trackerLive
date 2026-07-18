import { DayRecord, NotificationSettings } from '../types';

// All checks are "should this fire right now" functions, evaluated on a
// periodic timer while the app is open (see app.component.ts). This app has
// no push server, so notifications cannot fire while the app/browser is
// fully closed — an honest constraint of a client-only PWA, not a bug.
// [step 46]

export function shouldFireWindDown(settings: NotificationSettings, windDownTime: string, now: Date = new Date()): boolean {
  if (!settings.windDown) return false;
  const [h, m] = windDownTime.split(':').map(Number);
  return now.getHours() === h && now.getMinutes() === m;
}

export function shouldFireHourlyLog(settings: NotificationSettings, now: Date = new Date()): boolean {
  if (!settings.hourlyLog) return false;
  // Fire once near the top of each hour (minute 0) rather than every
  // minute — the periodic check runs every minute, so gate on minute===0.
  return now.getMinutes() === 0;
}

export function shouldFireBlockStart(
  settings: NotificationSettings,
  record: DayRecord | undefined,
  now: Date = new Date()
): { fire: boolean; action?: string } {
  if (!settings.blockStart || !record?.plannedBlocks) return { fire: false };
  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const block = record.plannedBlocks.find(b => !b.done && b.time === nowStr);
  return block ? { fire: true, action: block.action } : { fire: false };
}

// Hyperfocus guard notification is a companion to the in-app visual+audio
// cue (step 18) — fires the same 90-minute threshold as a system
// notification too, in case the tab isn't focused. Takes the same
// continuousFocusStartedAt timestamp the focus timer already tracks.
export function shouldFireHyperfocusGuard(
  settings: NotificationSettings,
  continuousFocusStartedAt: number,
  alreadyNotified: boolean,
  now: Date = new Date()
): boolean {
  if (!settings.hyperfocusGuard || !continuousFocusStartedAt || alreadyNotified) return false;
  const continuousMin = (now.getTime() - continuousFocusStartedAt) / 60000;
  return continuousMin >= 90;
}
