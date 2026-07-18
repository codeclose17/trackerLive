import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  get permission(): NotificationPermission {
    if (typeof Notification === 'undefined') return 'denied';
    return Notification.permission;
  }

  get isSupported(): boolean {
    return typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
  }

  // Must be called from a direct user gesture (a click handler) — browsers
  // reject permission requests that aren't. Never call this on app load or
  // from a timer. [step 46]
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) return 'denied';
    return Notification.requestPermission();
  }

  // Shows a notification via the service worker registration so it can
  // display even when the tab isn't focused (as long as the browser is
  // running) — a plain `new Notification()` would only work while the page
  // is open and focused, which defeats the point of a wind-down/hourly
  // reminder.
  async show(title: string, body: string, tag: string): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') return;
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        tag, // replaces any existing notification with the same tag rather than stacking
        icon: 'icons/icon-192x192.png',
        badge: 'icons/icon-192x192.png'
      });
    } catch {
      /* notifications unavailable (e.g. no service worker in this
         environment) — fail silently, this is a nice-to-have, not
         critical path */
    }
  }
}
