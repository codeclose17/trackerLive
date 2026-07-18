import { Component, Input, Output, EventEmitter, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { KbService, KB_CHAPTERS, KbChapter } from '../../services/kb.service';

@Component({
  selector: 'app-kb-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kb-panel-backdrop" *ngIf="isOpen" (click)="close.emit()">
      <div class="kb-panel" (click)="$event.stopPropagation()">
        <div class="kb-panel-nav">
          <div class="kb-panel-nav-head">
            <span class="today-eyebrow">ADHD Knowledge Base</span>
            <button class="kb-panel-close-mobile btn btn-secondary btn-icon" (click)="close.emit()" aria-label="Close">✕</button>
          </div>
          <input
            class="form-input kb-panel-search"
            type="search"
            placeholder="Filter chapters…"
            [(ngModel)]="searchQuery"
          />
          <div class="kb-panel-chapter-list">
            <ng-container *ngFor="let group of groupedChapters">
              <div class="kb-panel-group-label" *ngIf="group.chapters.length > 0">{{ group.name }}</div>
              <button
                *ngFor="let chapter of group.chapters"
                class="kb-panel-chapter-btn"
                [class.active]="chapter.id === activeChapterId"
                (click)="selectChapter(chapter.id)"
              >
                <span class="idx">{{ chapter.index.toString().padStart(2, '0') }}</span>
                <span>{{ chapter.title }}</span>
              </button>
            </ng-container>
          </div>
        </div>

        <div class="kb-panel-content" #contentScroll>
          <button class="kb-panel-close-desktop btn btn-secondary btn-icon" (click)="close.emit()" aria-label="Close">✕</button>
          <div class="kb-content" [innerHTML]="activeChapterHtml"></div>
        </div>
      </div>
    </div>
  `
})
export class KbPanelComponent implements OnChanges, AfterViewInit {
  @Input() isOpen = false;
  @Input() initialChapterId: string | null = null;
  @Output() close = new EventEmitter<void>();

  @ViewChild('contentScroll') contentScroll?: ElementRef<HTMLElement>;

  chapters = KB_CHAPTERS;
  activeChapterId = 'definition';
  activeChapterHtml: SafeHtml = '';
  searchQuery = '';

  private sectionsHtml = new Map<string, string>();

  constructor(private kbService: KbService, private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    if (this.isOpen) {
      this.loadContent();
    }
  }

  ngAfterViewInit(): void {
    if (this.isOpen) {
      this.loadContent();
    }
  }

  private loadContent(): void {
    if (this.initialChapterId) {
      this.activeChapterId = this.initialChapterId;
    }
    this.kbService.getSectionsHtml().subscribe((map) => {
      this.sectionsHtml = map;
      this.setActiveChapterHtml(this.activeChapterId);
    });
  }

  // The KB content is our own static asset, not user input, so trusting it
  // is safe — needed because Angular's default sanitizer strips inline
  // style="" attributes and some SVG the KB's authored markup relies on
  // (e.g. .region h4 .pin dot colors set inline per-instance).
  private setActiveChapterHtml(id: string): void {
    const raw = this.sectionsHtml.get(id) || '';
    this.activeChapterHtml = this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  get groupedChapters(): { name: string; chapters: KbChapter[] }[] {
    const groups: { name: string; chapters: KbChapter[] }[] = [];
    const q = this.searchQuery.trim().toLowerCase();
    this.chapters.forEach((chapter) => {
      if (q && !chapter.title.toLowerCase().includes(q)) return;
      let group = groups.find(g => g.name === chapter.group);
      if (!group) {
        group = { name: chapter.group, chapters: [] };
        groups.push(group);
      }
      group.chapters.push(chapter);
    });
    return groups;
  }

  selectChapter(id: string): void {
    this.activeChapterId = id;
    this.setActiveChapterHtml(id);
    this.contentScroll?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
