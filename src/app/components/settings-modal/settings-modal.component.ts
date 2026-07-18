import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DbService } from '../../services/db.service';
import { BoredomActivity } from '../../types';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="modal-close-btn btn btn-secondary btn-icon" (click)="close.emit()">
          <!-- X Icon SVG -->
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <h2>Settings & Cloud Sync</h2>
        <p class="modal-subtitle">Configure real-time database sync or backup your data.</p>

        <!-- SECTION 1: SUPABASE CONFIG -->
        <div class="settings-section">
          <h3>
            <!-- Database Icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
            Supabase Realtime Sync
          </h3>
          <p class="section-desc">
            Sync your tracker across your phone and laptop instantly. 
            No subscriptions or credit cards required.
          </p>

          <div class="form-group">
            <label>Supabase Project URL</label>
            <input
              type="text"
              class="form-input"
              placeholder="https://your-project-id.supabase.co"
              [(ngModel)]="url"
            />
          </div>

          <div class="form-group">
            <label>Supabase Anon Public API Key</label>
            <input
              type="password"
              class="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              [(ngModel)]="key"
            />
          </div>

          <div class="sync-toggle-row">
            <div class="toggle-info">
              <span class="toggle-label">Enable Cloud Syncing</span>
              <span class="toggle-sub">Saves updates to your database in real time.</span>
            </div>
            <label class="switch">
              <input
                type="checkbox"
                [(ngModel)]="enabled"
                [disabled]="!url || !key"
              />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="connection-actions">
            <button
              class="btn btn-secondary"
              (click)="handleTestConnection()"
              [disabled]="testing || !url || !key"
            >
              <span *ngIf="testing" style="display: flex; align-items: center; gap: 6px;">
                <!-- Spinner SVG -->
                <svg class="spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8"/><path d="M21 3v5h-5"/></svg>
                Testing...
              </span>
              <span *ngIf="!testing">Test Connection</span>
            </button>
            
            <span *ngIf="testResult === 'success'" class="test-success">
              <!-- Check Icon SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 6 9 17l-5-5"/></svg>
              Connection Successful!
            </span>
            <span *ngIf="testResult === 'failed'" class="test-failed">
              <!-- X Icon SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              Connection Failed. Check credentials or table setup.
            </span>
          </div>
        </div>

        <!-- SECTION 2: SUPABASE SETUP GUIDE -->
        <div class="settings-section guide-section">
          <h3>How to Set Up Your Free Database (2 Minutes)</h3>
          <ol class="setup-steps">
            <li>
              Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a> and sign up for a <strong>Free Tier</strong> account (no card needed).
            </li>
            <li>Create a new project. Name it something like <code>hour-tracker</code> and set a password.</li>
            <li>
              Once your project builds, open the <strong>SQL Editor</strong> in the left sidebar and click <strong>"New Query"</strong>.
            </li>
            <li>
              Copy the SQL below, paste it into the editor, and click <strong>Run</strong>:
            </li>
          </ol>

          <div class="sql-box-wrapper">
            <div class="sql-box-header">
              <span>SQL Setup Script</span>
              <button class="btn btn-secondary btn-sm copy-sql-btn" (click)="copySql()">
                <span *ngIf="copied; else notCopied" style="display: flex; align-items: center; gap: 4px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Copied!
                </span>
                <ng-template #notCopied>
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    Copy Script
                  </span>
                </ng-template>
              </button>
            </div>
            <pre class="sql-code"><code>{{ sqlSnippet }}</code></pre>
          </div>

          <ol class="setup-steps" start="5">
            <li>
              Go to <strong>Project Settings</strong> (gear icon) &rarr; <strong>API</strong>.
            </li>
            <li>
              Copy the <strong>Project URL</strong> and <strong><code>anon</code> public key</strong>, and paste them above.
            </li>
          </ol>
        </div>

        <!-- SECTION 2.5: PERSONAL SAFETY NET (friction card + boredom kit) -->
        <div class="settings-section">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
            Personal safety net
          </h3>
          <p class="section-desc">Written in a calm moment, shown to you in a tempted one.</p>

          <div class="form-group">
            <label>Your "why" — shown before you continue past a logged urge</label>
            <textarea
              class="form-input notes-textarea"
              placeholder="e.g. I want to remember how good it feels to finish what I start…"
              [(ngModel)]="frictionWhyText"
              maxlength="240"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Boredom kit — up to 5 quick, dopamine-safe activities</label>
            <div class="boredom-editor-list">
              <div class="boredom-editor-row" *ngFor="let activity of boredomActivities; let i = index">
                <input class="form-input" type="text" [(ngModel)]="activity.text" maxlength="60" placeholder="e.g. 20 push-ups" />
                <button class="btn btn-secondary btn-icon btn-sm-square" (click)="removeBoredomActivity(i)" title="Remove">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="addBoredomActivity()" [disabled]="boredomActivities.length >= 5">+ Add activity</button>
          </div>
        </div>

        <!-- SECTION 3: BACKUP / EXPORT / IMPORT -->
        <div class="settings-section backup-section">
          <h3>
            <!-- Key Icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            Backup & Local Data
          </h3>
          <p class="section-desc">
            Download your tracker data as a local JSON file or import a backup.
          </p>
          <div class="backup-buttons">
            <button class="btn btn-secondary" (click)="exportData.emit()">
              <!-- Download Icon SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Export JSON Backup
            </button>

            <label class="btn btn-secondary file-upload-label">
              <!-- Upload Icon SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <span>{{ importing ? 'Importing...' : 'Import JSON Backup' }}</span>
              <input
                type="file"
                accept=".json"
                (change)="handleFileImport($event)"
                [disabled]="importing"
                style="display: none;"
              />
            </label>
          </div>

          <div *ngIf="importStatus === 'success'" class="import-feedback success">Data imported successfully!</div>
          <div *ngIf="importStatus === 'failed'" class="import-feedback error">Failed to import data. Invalid format.</div>
        </div>

        <!-- ACTIONS -->
        <div class="modal-footer-actions">
          <button class="btn btn-secondary" (click)="close.emit()">
            Cancel
          </button>
          <button class="btn btn-primary" (click)="handleSave()">
            Save settings
          </button>
        </div>
      </div>
    </div>
  `
})
export class SettingsModalComponent implements OnInit {
  @Input() supabaseUrl = '';
  @Input() supabaseAnonKey = '';
  @Input() syncEnabled = false;
  @Input() initialFrictionWhyText = '';
  @Input() initialBoredomActivities: BoredomActivity[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() saveSettings = new EventEmitter<{
    supabaseUrl: string;
    supabaseAnonKey: string;
    syncEnabled: boolean;
    frictionWhyText: string;
    boredomActivities: BoredomActivity[];
  }>();
  @Output() exportData = new EventEmitter<void>();
  @Output() importData = new EventEmitter<File>();

  frictionWhyText = '';
  boredomActivities: BoredomActivity[] = [];

  url = '';
  key = '';
  enabled = false;
  testing = false;
  testResult: 'idle' | 'success' | 'failed' = 'idle';
  copied = false;
  importing = false;
  importStatus: 'idle' | 'success' | 'failed' = 'idle';

  sqlSnippet = `-- 1. Create the tracker table & categories table
create table if not exists public.tracker_records (
  date text primary key,
  hours text[] not null,
  notes text default '',
  binge_count integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: For existing databases, run this individually to add the new column:
-- alter table public.tracker_records add column if not exists binge_count integer default 0;

create table if not exists public.tracker_categories (
  id text primary key,
  name text not null,
  color text not null,
  is_custom boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Disable RLS (Easiest setup for private database using anon key)
alter table public.tracker_records disable row level security;
alter table public.tracker_categories disable row level security;

-- 3. Enable Realtime sync for these tables
-- Note: If tracker_records is already in publication, you can run this individually for tracker_categories:
alter publication supabase_realtime add table public.tracker_categories;
-- (For clean installation, also add tracker_records if not already added)
-- alter publication supabase_realtime add table public.tracker_records;`;

  constructor(private dbService: DbService) {}

  ngOnInit(): void {
    this.url = this.supabaseUrl;
    this.key = this.supabaseAnonKey;
    this.enabled = this.syncEnabled;
    this.frictionWhyText = this.initialFrictionWhyText;
    this.boredomActivities = this.initialBoredomActivities.map(a => ({ ...a }));
  }

  addBoredomActivity(): void {
    if (this.boredomActivities.length >= 5) return;
    this.boredomActivities = [
      ...this.boredomActivities,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: '' }
    ];
  }

  removeBoredomActivity(index: number): void {
    this.boredomActivities = this.boredomActivities.filter((_, i) => i !== index);
  }

  async handleTestConnection(): Promise<void> {
    if (!this.url || !this.key) {
      this.testResult = 'failed';
      return;
    }
    this.testing = true;
    this.testResult = 'idle';
    try {
      const success = await this.dbService.testConnection(this.url, this.key);
      this.testResult = success ? 'success' : 'failed';
    } catch {
      this.testResult = 'failed';
    } finally {
      this.testing = false;
    }
  }

  handleSave(): void {
    this.saveSettings.emit({
      supabaseUrl: this.url.trim(),
      supabaseAnonKey: this.key.trim(),
      syncEnabled: this.enabled && this.url.trim() !== '' && this.key.trim() !== '',
      frictionWhyText: this.frictionWhyText.trim(),
      boredomActivities: this.boredomActivities.filter(a => a.text.trim() !== '')
    });
  }

  copySql(): void {
    navigator.clipboard.writeText(this.sqlSnippet);
    this.copied = true;
    setTimeout(() => this.copied = false, 2000);
  }

  handleFileImport(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.importing = true;
    this.importStatus = 'idle';
    
    // We will let app component parse, but to show feedback we handle it here via callback
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          // Trigger parent emitter
          this.importData.emit(file);
          this.importStatus = 'success';
        } else {
          this.importStatus = 'failed';
        }
      } catch {
        this.importStatus = 'failed';
      } finally {
        this.importing = false;
      }
    };
    reader.onerror = () => {
      this.importStatus = 'failed';
      this.importing = false;
    };
    reader.readAsText(file);
  }
}
