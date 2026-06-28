import { Component, NgZone, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskLoggerService, TaskType, TaskMode } from '../services/task-logger.service';
import { ConfigService } from '../services/config.service';
import { COLOR_SCALES, getContinuousGradient, getCategoricalColors } from '../shared/interfaces/color-scale';
import { drawRadarChart, drawWhiskerGlyph, drawFlowerGlyph } from '../shared/helpers/d3-helper';
import { GlyphObject } from '../glyph/glyph-object';
import { GlyphConfiguration } from '../glyph/glyph-configuration';
import { GlyphType } from '../shared/enum/glyph-type';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-taskbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './taskbar.component.html',
  styleUrl: './taskbar.component.scss'
})
export class TaskbarComponent implements AfterViewInit, OnDestroy {
  TaskType = TaskType;
  GlyphType = GlyphType;
  panelOpen = false;
  participantId = '';
  selectedMode: TaskMode = 'semantic-zoom';
  pendingModeIntro: TaskMode | null = null;
  private tickInterval: any = null;
  private configSub = new Subscription();

  @ViewChild('legendCanvas') legendCanvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(public logger: TaskLoggerService, public config: ConfigService, private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.configSub.add(
      this.config.glyphConfigSubject$.subscribe(() => this.drawLegendGlyph())
    );
    setTimeout(() => this.drawLegendGlyph());
  }

  private drawLegendGlyph(): void {
    const canvas = this.legendCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const activeFeatures = this.config.activeFeatures;
    if (activeFeatures.length === 0) return;

    const sampleGlyph = { id: 'legend', currentContext: 1, features: { '1': {} as Record<string, number> } } as unknown as GlyphObject;
    for (const f of activeFeatures) {
      sampleGlyph.features['1'][f] = 0.5;
    }

    const config = this.config.getConfiguration();
    const color = 'rgba(52, 152, 219, 0.6)';
    const radius = Math.min(w, h) * 0.28;

    drawFlowerGlyph(ctx, radius, color, sampleGlyph, activeFeatures, this.config.featureLabels, config);
  }

  get colorFeatureLabel(): string {
    const feature = this.config.colorFeature;
    if (!feature) return '';
    const labels = this.config.featureLabels;
    return labels[feature] || feature;
  }

  get colorGradientStyle(): string {
    const feature = this.config.colorFeature;
    if (!feature) return '';
    const scaleId = this.config.colorRange;
    const scale = COLOR_SCALES.find(s => s.id === scaleId) || COLOR_SCALES[0];
    if (scale.type === 'categorical') {
      const colors = getCategoricalColors(scale);
      const stops = colors.map((c, i) => `${c} ${(i / colors.length) * 100}%, ${c} ${((i + 1) / colors.length) * 100}%`).join(', ');
      return `linear-gradient(to right, ${stops})`;
    }
    return getContinuousGradient(scale);
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
    setTimeout(() => this.drawLegendGlyph());
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
      this.exportResults();
    }
  }

  skipTask(): void {
    this.nextTask();
  }

  dismissIntro(): void {
    this.pendingModeIntro = null;
    setTimeout(() => this.drawLegendGlyph());
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

  ngOnDestroy(): void {
    this.configSub.unsubscribe();
    this.stopTick();
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

  get currentIndex(): number {
    return this.logger.currentTaskIndex;
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
