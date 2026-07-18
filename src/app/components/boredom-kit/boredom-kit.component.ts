import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoredomActivity } from '../../types';

const MAX_ACTIVITIES = 5;

@Component({
  selector: 'app-boredom-kit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button class="boredom-kit-launcher card" (click)="isOpen = true">
      <span>🧊 I'm bored</span>
    </button>

    <div class="impulse-flow-backdrop" *ngIf="isOpen" (click)="isOpen = false">
      <div class="impulse-flow-sheet card" (click)="$event.stopPropagation()">
        <h4>Quick, dopamine-safe options</h4>

        <div class="boredom-activities" *ngIf="activities.length > 0">
          <button
            *ngFor="let activity of activities"
            class="boredom-activity-btn"
            (click)="pick(activity)"
          >{{ activity.text }}</button>
        </div>
        <p class="ritual-hint" *ngIf="activities.length === 0">
          No activities set up yet — add up to 5 in Settings so they show here.
        </p>

        <button class="btn btn-secondary" (click)="isOpen = false">Close</button>
      </div>
    </div>
  `
})
export class BoredomKitComponent {
  @Input() activities: BoredomActivity[] = [];
  @Output() activityPicked = new EventEmitter<BoredomActivity>();

  isOpen = false;
  maxActivities = MAX_ACTIVITIES;

  pick(activity: BoredomActivity): void {
    this.activityPicked.emit(activity);
    this.isOpen = false;
  }
}
