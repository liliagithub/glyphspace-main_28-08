import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskLoggerService, TaskType, TaskMode } from '../services/task-logger.service';

@Component({
  selector: 'app-taskbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './taskbar.component.html',
  styleUrl: './taskbar.component.scss'
})
export class TaskbarComponent {
  TaskType = TaskType;
  panelOpen = false;
  participantId = '';
  selectedMode: TaskMode = 'semantic-zoom';
  pendingModeIntro: TaskMode | null = null;
  private tickInterval: any = null;

  constructor(public logger: TaskLoggerService, private ngZone: NgZone) {}

  get currentIndex(): number {
    return this.logger.currentTaskIndex;
  }

  get totalTasks(): number {
    return this.logger.taskDefinitions.length;
  }

  getElapsedMs(): number {
    const run = this.logger.currentRun;
    if (!run || run.startTime === 0) return 0;
    if (run.completed && run.duration) return run.duration;
    return Date.now() - run.startTime;
  }

  get canStart(): boolean {
    return this.participantId.trim().length > 0;
  }

  startStudy(): void {
    if (!this.canStart) return;
    this.pendingModeIntro = this.selectedMode;
    this.logger.startStudy(this.participantId.trim(), this.selectedMode);
    this.panelOpen = true;
    this.startTick();
  }

  private nextTaskMode(): TaskMode | null {
    const nextIdx = this.currentIndex + 1;
    if (nextIdx >= this.totalTasks) return null;
    return this.logger.taskDefinitions[nextIdx].mode;
  }

  nextTask(): void {
    const nextMode = this.nextTaskMode();
    if (nextMode && nextMode !== this.logger.currentMode) {
      this.pendingModeIntro = nextMode;
    }
    this.logger.nextTask();
    if (this.currentIndex >= this.totalTasks) {
      this.stopTick();
    }
  }

  skipTask(): void {
    this.nextTask();
  }

  dismissIntro(): void {
    this.pendingModeIntro = null;
  }

  exportResults(): void {
    this.logger.downloadResults();
  }

  resetSession(): void {
    if (confirm('Alle Studiendaten zurücksetzen? Dies kann nicht rückgängig gemacht werden.')) {
      this.logger.resetSession();
      this.stopTick();
      this.participantId = '';
      this.selectedMode = 'semantic-zoom';
      this.pendingModeIntro = null;
    }
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    if (this.panelOpen && this.logger.isRunning) {
      this.startTick();
    } else if (!this.panelOpen) {
      this.stopTick();
    }
  }

  private startTick(): void {
    this.stopTick();
    this.ngZone.runOutsideAngular(() => {
      this.tickInterval = setInterval(() => {
        if (this.logger.isRunning) {
          this.ngZone.run(() => {});
        }
      }, 200);
    });
  }

  private stopTick(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  getModeLabel(mode: string): string {
    return mode === 'semantic-zoom' ? 'Zoom' : 'Linse';
  }

  isStudyComplete(): boolean {
    return this.currentIndex >= this.totalTasks;
  }

  isLastTask(): boolean {
    return this.currentIndex + 1 >= this.totalTasks;
  }

  hasSolution(): boolean {
    return !!this.logger.currentRun?.solutionGlyphId;
  }

  getSolutionGlyphId(): string {
    return this.logger.currentRun?.solutionGlyphId || '';
  }

  getCompletedCount(): number {
    return this.logger.session.runs.filter(r => r.completed).length;
  }

  getProgressPercent(): number {
    if (this.totalTasks === 0) return 0;
    return (this.currentIndex / this.totalTasks) * 100;
  }
}
