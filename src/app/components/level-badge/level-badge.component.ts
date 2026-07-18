import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { levelProgress } from '../../utils/gamification';

@Component({
  selector: 'app-level-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="level-badge" [title]="progress.xpIntoLevel + ' / ' + progress.xpForNextLevel + ' XP to level ' + (progress.level + 1)">
      <span class="level-badge-num">Lv {{ progress.level }}</span>
      <div class="level-badge-bar">
        <div class="level-badge-fill" [style.width.%]="progress.percent"></div>
      </div>
    </div>
  `
})
export class LevelBadgeComponent {
  @Input() xp = 0;

  get progress() {
    return levelProgress(this.xp);
  }
}
