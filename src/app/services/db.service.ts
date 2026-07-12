import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, DayRecord } from '../types';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private supabaseInstance: SupabaseClient | null = null;
  private currentSupabaseUrl = '';

  private readonly LOCAL_STORAGE_RECORDS_KEY = 'box_tracker_records';
  private readonly LOCAL_STORAGE_SETTINGS_KEY = 'box_tracker_settings';

  constructor() {}

  // Initialize and get the Supabase client
  getSupabaseClient(url: string, anonKey: string): SupabaseClient | null {
    const trimmedUrl = (url || '').trim();
    const trimmedKey = (anonKey || '').trim();
    if (!trimmedUrl || !trimmedKey) return null;

    if (!this.supabaseInstance || this.currentSupabaseUrl !== trimmedUrl) {
      try {
        this.supabaseInstance = createClient(trimmedUrl, trimmedKey, {
          auth: {
            persistSession: false
          }
        });
        this.currentSupabaseUrl = trimmedUrl;
      } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
        this.supabaseInstance = null;
        this.currentSupabaseUrl = '';
      }
    }
    return this.supabaseInstance;
  }

  // Test database connection
  async testConnection(url: string, anonKey: string): Promise<boolean> {
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) return false;

    try {
      const { error } = await client.from('tracker_records').select('date').limit(1);
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          return true; 
        }
        console.error('Database connection test failed:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Connection check threw error:', e);
      return false;
    }
  }

  // Fetch all records from Supabase
  async fetchRecords(url: string, anonKey: string): Promise<DayRecord[]> {
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) return [];

    const { data, error } = await client
      .from('tracker_records')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(row => ({
      date: row.date,
      hours: row.hours,
      notes: row.notes || '',
      updatedAt: row.updated_at
    }));
  }

  // Upsert a record to Supabase
  async upsertRecord(url: string, anonKey: string, record: DayRecord): Promise<void> {
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) return;

    const { error } = await client
      .from('tracker_records')
      .upsert({
        date: record.date,
        hours: record.hours,
        notes: record.notes,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  // Subscribe to realtime updates
  subscribeToChanges(
    url: string,
    anonKey: string,
    onInsertOrUpdate: (record: DayRecord) => void
  ): () => void {
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) return () => {};

    const channel = client
      .channel('tracker_realtime_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracker_records'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRow = payload.new;
            onInsertOrUpdate({
              date: newRow['date'],
              hours: newRow['hours'],
              notes: newRow['notes'] || '',
              updatedAt: newRow['updated_at']
            });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }

  // Local Storage - Records
  getLocalRecords(): Record<string, DayRecord> {
    const data = localStorage.getItem(this.LOCAL_STORAGE_RECORDS_KEY);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse local records:', e);
      return {};
    }
  }

  saveLocalRecords(records: Record<string, DayRecord>): void {
    localStorage.setItem(this.LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(records));
  }

  // Local Storage - Settings
  getLocalSettings(defaultCategories: Category[]): {
    supabaseUrl: string;
    supabaseAnonKey: string;
    syncEnabled: boolean;
    categories: Category[];
  } {
    const data = localStorage.getItem(this.LOCAL_STORAGE_SETTINGS_KEY);
    const fallback = {
      supabaseUrl: '',
      supabaseAnonKey: '',
      syncEnabled: false,
      categories: defaultCategories
    };

    if (!data) return fallback;

    try {
      const parsed = JSON.parse(data);
      return {
        supabaseUrl: parsed.supabaseUrl || '',
        supabaseAnonKey: parsed.supabaseAnonKey || '',
        syncEnabled: !!parsed.syncEnabled,
        categories: parsed.categories || defaultCategories
      };
    } catch (e) {
      console.error('Failed to parse settings:', e);
      return fallback;
    }
  }

  saveLocalSettings(settings: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    syncEnabled: boolean;
    categories: Category[];
  }): void {
    localStorage.setItem(this.LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  }
}
