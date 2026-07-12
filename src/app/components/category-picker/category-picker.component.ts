import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../types';

@Component({
  selector: 'app-category-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <ng-container *ngIf="layout === 'card'; else inlineTemplate">
      <div class="category-picker-card card">
        <div class="picker-header">
          <h3>Palette</h3>
          <button
            class="btn btn-secondary btn-sm"
            style="padding: 4px 10px; font-size: 0.8rem;"
            (click)="isEditing = !isEditing"
          >
            <span *ngIf="isEditing; else notEditing" style="display: flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Done Customizing
            </span>
            <ng-template #notEditing>
              <span style="display: flex; align-items: center; gap: 4px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Edit Palette
              </span>
            </ng-template>
          </button>
        </div>

        <div *ngIf="!isEditing; else editingMode">
          <div class="categories-palette">
            <div class="palette-instruction">
              Select a category to paint hours. Click-and-drag over the grid.
            </div>
            <div class="palette-grid">
              <button
                *ngFor="let cat of categories; let i = index"
                class="palette-item-btn"
                [class.active]="cat.id === activeCategoryId"
                [class.eraser-item]="cat.id === 'idle'"
                (click)="selectCategory.emit(cat.id)"
                [style.borderColor]="cat.id === activeCategoryId ? (cat.id === 'idle' ? 'var(--text-secondary)' : cat.color) : 'transparent'"
                [style.boxShadow]="cat.id === activeCategoryId ? (cat.id === 'idle' ? '0 0 12px rgba(255,255,255,0.1)' : '0 0 12px ' + cat.color + '44') : 'none'"
                [title]="cat.id === 'idle' ? 'Press shortcut ' + (i+1) + ' or E to select Eraser' : 'Press keyboard shortcut ' + (i+1)"
              >
                <ng-container *ngIf="cat.id === 'idle'; else standardDot">
                  <!-- Eraser Icon SVG -->
                  <svg class="eraser-icon-dot" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-secondary);"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21Z"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
                </ng-container>
                <ng-template #standardDot>
                  <span class="color-dot" [style.backgroundColor]="cat.color"></span>
                </ng-template>

                <span class="cat-name">{{ cat.id === 'idle' ? 'Eraser (Idle)' : cat.name }}</span>
                <span class="shortcut-key">{{ cat.id === 'idle' ? 'E' : (i + 1) }}</span>
              </button>
            </div>
          </div>
        </div>

        <ng-template #editingMode>
          <ng-container *ngTemplateOutlet="categoryEditorTemplate"></ng-container>
        </ng-template>
      </div>
    </ng-container>

    <!-- INLINE HEADER TEMPLATE -->
    <ng-template #inlineTemplate>
      <div class="palette-inline-container">
        <div class="palette-inline-grid">
          <button
            *ngFor="let cat of categories; let i = index"
            class="palette-inline-item"
            [class.active]="cat.id === activeCategoryId"
            [class.eraser-item]="cat.id === 'idle'"
            (click)="selectCategory.emit(cat.id)"
            [style.borderColor]="cat.id === activeCategoryId ? (cat.id === 'idle' ? 'var(--text-secondary)' : cat.color) : 'transparent'"
            [style.boxShadow]="cat.id === activeCategoryId ? (cat.id === 'idle' ? '0 0 10px rgba(255,255,255,0.08)' : '0 0 10px ' + cat.color + '33') : 'none'"
            [title]="cat.id === 'idle' ? 'Press shortcut ' + (i+1) + ' or E to select Eraser' : 'Press keyboard shortcut ' + (i+1)"
          >
            <span *ngIf="cat.id !== 'idle'" class="color-dot-inline" [style.backgroundColor]="cat.color"></span>
            <svg *ngIf="cat.id === 'idle'" class="eraser-icon-inline" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-secondary);"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21Z"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
            <span class="cat-name-inline">{{ cat.id === 'idle' ? 'Eraser' : cat.name }}</span>
            <span class="shortcut-key-inline">{{ cat.id === 'idle' ? 'E' : (i + 1) }}</span>
          </button>
        </div>

        <button
          class="btn btn-secondary btn-icon inline-edit-trigger"
          (click)="isEditing = !isEditing"
          title="Customize Categories"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>

        <!-- Customize popover overlay -->
        <div *ngIf="isEditing" class="palette-popover card">
          <div class="popover-header">
            <h4>Customize Categories</h4>
            <button class="btn btn-secondary btn-icon popover-close-btn" (click)="isEditing = false">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <ng-container *ngTemplateOutlet="categoryEditorTemplate"></ng-container>
        </div>
      </div>
    </ng-template>

    <!-- SHARED CATEGORY EDITOR SUBTEMPLATE -->
    <ng-template #categoryEditorTemplate>
      <div class="category-editor">
        <div class="category-edit-list">
          <div *ngFor="let cat of categories" class="category-edit-row">
            <input
              type="color"
              [value]="cat.color"
              class="color-picker-input"
              (change)="onColorChange(cat, $event)"
            />
            
            <input
              type="text"
              [value]="cat.name"
              class="form-input text-input-sm"
              (input)="onNameChange(cat, $event)"
            />

            <button
              *ngIf="cat.isCustom"
              type="button"
              class="btn btn-danger btn-icon btn-sm-square"
              (click)="deleteCategory.emit(cat.id)"
              title="Delete Category"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
            
            <div *ngIf="!cat.isCustom" class="system-tag" title="Default category cannot be deleted">
              System
            </div>
          </div>
        </div>

        <form (submit)="handleAdd($event)" class="add-category-form">
          <div class="form-row">
            <input
              type="color"
              [(ngModel)]="newCatColor"
              name="newCatColor"
              class="color-picker-input"
            />
            <input
              type="text"
              [(ngModel)]="newCatName"
              name="newCatName"
              placeholder="New Category Name..."
              class="form-input text-input-sm"
            />
            <button type="submit" class="btn btn-primary btn-icon btn-sm-square">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
          </div>
        </form>
      </div>
    </ng-template>
  `
})
export class CategoryPickerComponent implements OnChanges {
  @Input() categories: Category[] = [];
  @Input() activeCategoryId = '';
  @Input() layout: 'card' | 'inline' = 'card';

  @Output() selectCategory = new EventEmitter<string>();
  @Output() addCategory = new EventEmitter<Category>();
  @Output() updateCategory = new EventEmitter<Category>();
  @Output() deleteCategory = new EventEmitter<string>();

  isEditing = false;
  newCatName = '';
  newCatColor = '#8b5cf6';

  // Lifecycle hook to detect changes in inputs
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categories']) {
      console.log('CategoryPickerComponent - categories changed:', changes['categories'].currentValue);
    }
    if (changes['activeCategoryId']) {
      console.log('CategoryPickerComponent - activeCategoryId changed:', changes['activeCategoryId'].currentValue);
    }
  }

  onColorChange(cat: Category, event: any): void {
    console.log('Color change for category', cat.id, 'new color:', event.target.value);
    this.updateCategory.emit({ ...cat, color: event.target.value });
  }

  onNameChange(cat: Category, event: any): void {
    console.log('Name change for category', cat.id, 'new name:', event.target.value);
    this.updateCategory.emit({ ...cat, name: event.target.value });
  }

  handleAdd(event: Event): void {
    event.preventDefault();
    if (!this.newCatName.trim()) return;

    const id = 'custom_' + Date.now();
    const newCategory: Category = {
      id,
      name: this.newCatName.trim(),
      color: this.newCatColor,
      isCustom: true
    };
    console.log('Adding new category:', newCategory);
    this.addCategory.emit(newCategory);
    this.newCatName = '';
  }
}
