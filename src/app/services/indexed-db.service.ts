import { Injectable } from '@angular/core';

const DB_NAME = 'cadence_db';
const DB_VERSION = 1;

// Object stores for the local, high-write-frequency event logs (step 48).
// Each store just holds JSON-serializable records keyed by their own `id`.
const STORES = ['tasks', 'winLog', 'impulseLog', 'rsdEntries'] as const;
export type StoreName = typeof STORES[number];

// A minimal IndexedDB wrapper — deliberately not a dependency, since the
// need here is simple (get/put a whole array per store) and IndexedDB's
// native API is directly usable for that without a library. Repeated
// full-array JSON.stringify to localStorage (the previous approach) means
// every single win/impulse/task append re-serializes and re-writes the
// entire history; IndexedDB stores each record separately so appends stay
// cheap as the log grows.
@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        STORES.forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getAll<T>(store: StoreName): Promise<T[]> {
    try {
      const db = await this.openDb();
      return await new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  // Replaces the entire store's contents with the given array — used for
  // the initial migration from localStorage and for bulk operations
  // (delete-by-filter, import merges) where recomputing the whole set is
  // simpler than diffing.
  async putAll<T extends { id: string }>(store: StoreName, items: T[]): Promise<void> {
    try {
      const db = await this.openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const os = tx.objectStore(store);
        os.clear();
        items.forEach(item => os.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* IndexedDB unavailable — caller's data simply won't persist across
         reloads in that environment; nothing else in the app depends on
         this succeeding synchronously */
    }
  }

  // Appends a single record without touching the rest of the store — the
  // actual perf win over the old full-array-rewrite approach.
  async add<T extends { id: string }>(store: StoreName, item: T): Promise<void> {
    try {
      const db = await this.openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* see putAll */
    }
  }

  async remove(store: StoreName, id: string): Promise<void> {
    try {
      const db = await this.openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* see putAll */
    }
  }
}
