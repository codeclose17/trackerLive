import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, SyncState } from '../../types';
import { CategoryPickerComponent } from '../category-picker/category-picker.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, CategoryPickerComponent],
  template: `
    <header class="header-container">
      <!-- 1. LOGO -->
      <div class="header-logo">
        <div class="logo-icon">⏳</div>
        <div>
          <h1>ChronoBox</h1>
          <p class="subtitle">Your 14-Day 24-Hour Life Tracker</p>
        </div>
      </div>

      <!-- 2. DYNAMIC COLOR PALETTE IN THE MIDDLE -->
      <div class="header-palette">
        <app-category-picker
          [layout]="'inline'"
          [categories]="categories"
          [activeCategoryId]="activeCategoryId"
          (selectCategory)="selectCategory.emit($event)"
          (addCategory)="addCategory.emit($event)"
          (updateCategory)="updateCategory.emit($event)"
          (deleteCategory)="deleteCategory.emit($event)"
        ></app-category-picker>
      </div>

      <!-- 3. ACTIONS & NAVIGATION -->
      <div class="header-controls">
        <div class="period-navigator">
          <button class="btn btn-secondary btn-icon" (click)="prevPeriod.emit()" title="Previous 14 Days">
            <!-- ChevronLeft SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          
          <button class="date-range-display btn btn-secondary" (click)="resetPeriod.emit()" title="Jump to Current 14 Days">
            <!-- Calendar SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
            <span>{{ dateRangeText }}</span>
          </button>
          
          <button class="btn btn-secondary btn-icon" (click)="nextPeriod.emit()" title="Next 14 Days">
            <!-- ChevronRight SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <div class="sync-badge-container">
          <div *ngIf="isSyncEnabled; else localOnly" class="sync-badge" [ngClass]="syncState.status">
            <!-- Syncing Spinner SVG -->
            <svg *ngIf="syncState.status === 'syncing'" class="spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8"/><path d="M21 3v5h-5"/></svg>
            
            <!-- Cloud SVG (non-syncing success/idle) -->
            <svg *ngIf="syncState.status !== 'syncing'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.89-1.74-3.5-3.5-4.11-2.45-.87-5.18.57-5.85 3C4.9 10.26 3 12 3 14.5A3.5 3.5 0 0 0 6.5 18"/></svg>
            
            <span>
              {{ syncState.status === 'syncing' ? 'Syncing...' : '' }}
              {{ syncState.status === 'success' ? 'Synced' : '' }}
              {{ syncState.status === 'error' ? 'Sync Error' : '' }}
              {{ syncState.status === 'idle' ? 'Connected' : '' }}
            </span>
          </div>
          
          <ng-template #localOnly>
            <div class="sync-badge local">
              <!-- CloudOff SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12H3.5a3.5 3.5 0 0 0 0 7h13a3.5 3.5 0 0 0 1.25-.23"/><path d="M8 6.5A5.5 5.5 0 0 1 17.5 11c.4.15.8.35 1.15.6"/><path d="m2 2 20 20"/></svg>
              <span>Local Only</span>
            </div>
          </ng-template>
        </div>

        <button class="btn btn-secondary btn-icon settings-trigger" (click)="openSettings.emit()" title="Settings & Sync">
          <!-- Settings Icon SVG -->
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  @Input() dateRangeText = '';
  @Input() syncState: SyncState = { status: 'idle' };
  @Input() isSyncEnabled = false;
  
  @Input() categories: Category[] = [];
  @Input() activeCategoryId = '';

  @Output() prevPeriod = new EventEmitter<void>();
  @Output() nextPeriod = new EventEmitter<void>();
  @Output() resetPeriod = new EventEmitter<void>();
  @Output() openSettings = new EventEmitter<void>();

  @Output() selectCategory = new EventEmitter<string>();
  @Output() addCategory = new EventEmitter<Category>();
  @Output() updateCategory = new EventEmitter<Category>();
  @Output() deleteCategory = new EventEmitter<string>();
}
