import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, DayRecord, SyncLog } from '../types';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private supabaseInstance: SupabaseClient | null = null;
  private currentSupabaseUrl = '';

  private readonly LOCAL_STORAGE_RECORDS_KEY = 'box_tracker_records';
  private readonly LOCAL_STORAGE_SETTINGS_KEY = 'box_tracker_settings';

  public logCallback: (msg: string, type: 'info' | 'success' | 'error') => void = () => {};

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
    this.logCallback('Testing connection to Supabase...', 'info');
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) {
      this.logCallback('Supabase client failed to initialize during test', 'error');
      return false;
    }

    try {
      const { error } = await client.from('tracker_records').select('date').limit(1);
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          this.logCallback('Connection test successful (table empty/not found, but connected)', 'success');
          return true; 
        }
        this.logCallback(`Connection test failed: ${error.message}`, 'error');
        console.error('Database connection test failed:', error);
        return false;
      }
      this.logCallback('Connection test successful', 'success');
      return true;
    } catch (e: any) {
      this.logCallback(`Connection test threw error: ${e.message || e}`, 'error');
      console.error('Connection check threw error:', e);
      return false;
    }
  }

  // Fetch all records from Supabase
  async fetchRecords(url: string, anonKey: string): Promise<DayRecord[]> {
    this.logCallback('Fetching records from Supabase...', 'info');
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) {
      this.logCallback('Supabase client not initialized for fetching records', 'error');
      return [];
    }

    const { data, error } = await client
      .from('tracker_records')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      this.logCallback(`Fetch records failed: ${error.message}`, 'error');
      throw new Error(error.message);
    }

    this.logCallback(`Successfully fetched ${(data || []).length} day records`, 'success');
    return (data || []).map(row => ({
      date: row.date,
      hours: row.hours,
      notes: row.notes || '',
      updatedAt: row.updated_at
    }));
  }

  // Upsert a record to Supabase
  async upsertRecord(url: string, anonKey: string, record: DayRecord): Promise<void> {
    this.logCallback(`Upserting day record for ${record.date}...`, 'info');
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) {
      this.logCallback('Supabase client not initialized for upserting record', 'error');
      return;
    }

    const { error } = await client
      .from('tracker_records')
      .upsert({
        date: record.date,
        hours: record.hours,
        notes: record.notes,
        updated_at: new Date().toISOString()
      });

    if (error) {
      this.logCallback(`Upsert record for ${record.date} failed: ${error.message}`, 'error');
      throw new Error(error.message);
    }
    this.logCallback(`Successfully upserted record for ${record.date}`, 'success');
  }

  // Subscribe to realtime updates
  subscribeToChanges(
    url: string,
    anonKey: string,
    onInsertOrUpdate: (record: DayRecord) => void
  ): () => void {
    this.logCallback('Subscribing to realtime records changes...', 'info');
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
          this.logCallback(`Realtime records event: ${payload.eventType}`, 'info');
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRow = payload.new;
            this.logCallback(`Realtime record update received for date ${newRow['date']}`, 'success');
            onInsertOrUpdate({
              date: newRow['date'],
              hours: newRow['hours'],
              notes: newRow['notes'] || '',
              updatedAt: newRow['updated_at']
            });
          }
        }
      )
      .subscribe((status) => {
        this.logCallback(`Realtime records channel status: ${status}`, 'info');
      });

    return () => {
      this.logCallback('Unsubscribing from realtime records channel', 'info');
      client.removeChannel(channel);
    };
  }

  // Fetch all categories from Supabase
  async fetchCategories(url: string, anonKey: string): Promise<Category[]> {
    this.logCallback('Fetching categories from Supabase...', 'info');
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) {
      this.logCallback('Supabase client not initialized for fetching categories', 'error');
      return [];
    }

    const { data, error } = await client
      .from('tracker_categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      this.logCallback(`Fetch categories failed: ${error.message}`, 'error');
      throw new Error(error.message);
    }

    this.logCallback(`Successfully fetched ${(data || []).length} categories`, 'success');
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      isCustom: !!row.is_custom,
      updatedAt: row.updated_at
    }));
  }

  // Upsert a category to Supabase
  async upsertCategory(url: string, anonKey: string, category: Category): Promise<void> {
    this.logCallback(`Upserting category: ${category.name} (${category.id})...`, 'info');
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) {
      this.logCallback('Supabase client not initialized for upserting category', 'error');
      return;
    }

    const { error } = await client
      .from('tracker_categories')
      .upsert({
        id: category.id,
        name: category.name,
        color: category.color,
        is_custom: !!category.isCustom,
        updated_at: category.updatedAt || new Date().toISOString()
      });

    if (error) {
      this.logCallback(`Upsert category ${category.name} failed: ${error.message}`, 'error');
      throw new Error(error.message);
    }
    this.logCallback(`Successfully upserted category: ${category.name}`, 'success');
  }

  // Delete a category from Supabase
  async deleteCategory(url: string, anonKey: string, categoryId: string): Promise<void> {
    this.logCallback(`Deleting category ID ${categoryId} from Supabase...`, 'info');
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) {
      this.logCallback('Supabase client not initialized for deleting category', 'error');
      return;
    }

    const { error } = await client
      .from('tracker_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      this.logCallback(`Delete category ID ${categoryId} failed: ${error.message}`, 'error');
      throw new Error(error.message);
    }
    this.logCallback(`Successfully deleted category ID ${categoryId}`, 'success');
  }

  // Subscribe to realtime category updates
  subscribeToCategoryChanges(
    url: string,
    anonKey: string,
    onInsertOrUpdate: (category: Category) => void,
    onDelete: (categoryId: string) => void
  ): () => void {
    this.logCallback('Subscribing to realtime categories changes...', 'info');
    const client = this.getSupabaseClient(url, anonKey);
    if (!client) return () => {};

    const channel = client
      .channel('tracker_categories_realtime_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracker_categories'
        },
        (payload) => {
          this.logCallback(`Realtime categories event: ${payload.eventType}`, 'info');
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRow = payload.new;
            this.logCallback(`Realtime category update received: ${newRow['name']} (${newRow['id']})`, 'success');
            onInsertOrUpdate({
              id: newRow['id'],
              name: newRow['name'],
              color: newRow['color'],
              isCustom: !!newRow['is_custom'],
              updatedAt: newRow['updated_at']
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old;
            if (oldRow && oldRow['id']) {
              this.logCallback(`Realtime category deletion received for ID ${oldRow['id']}`, 'success');
              onDelete(oldRow['id']);
            }
          }
        }
      )
      .subscribe((status) => {
        this.logCallback(`Realtime categories channel status: ${status}`, 'info');
      });

    return () => {
      this.logCallback('Unsubscribing from realtime categories channel', 'info');
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
