import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DataLoaderService } from './data-loader.service';
import { Coordinates } from '../shared/interfaces/coordinates';
import { GlyphObject } from '../glyph/glyph-object';

export enum TaskType {
  Identification = 'Identifikation',
  Comparison = 'Vergleich',
  PatternRecognition = 'Mustererkennung',
  MultivariateAnalysis = 'Multivariate Analyse'
}

export type TaskMode = 'semantic-zoom' | 'magic-lens';

export interface TaskDefinition {
  id: string;
  type: TaskType;
  name: string;
  description: string;
  mode: TaskMode;
  expectedGlyphId?: string;
}

export interface TaskEvent {
  timestamp: number;
  type: 'zoom' | 'pan' | 'lens-move' | 'lens-toggle' | 'select' | 'task-start' | 'task-end' | 'solution';
  data?: Record<string, unknown>;
}

export interface TaskRun {
  taskId: string;
  taskType: TaskType;
  taskName: string;
  taskDescription: string;
  mode: TaskMode;
  startTime: number;
  endTime?: number;
  duration?: number;
  zoomDistance: number;
  lensDistance: number;
  panDistance: number;
  completed: boolean;
  solutionGlyphId: string | null;
  events: TaskEvent[];
  timestamp: string;
  algorithm: string;
  accuracy: boolean | null;
  deviation: number | null;
  expectedPositionDistance: number | null;
}

export interface TaskSession {
  id: string;
  startTime: number;
  endTime?: number;
  participantId?: string;
  startMode?: TaskMode;
  runs: TaskRun[];
}

export interface TaskExpectedInfo {
  glyphId: string;
  optimalScore: number;
  minScore: number;
  maxScore: number;
}

const TASK_DEFINITIONS_SEMANTIC_ZOOM: TaskDefinition[] = [
  { id: 'id-1-z', type: TaskType.Identification, name: 'Höchsten Gesamtzuckergehalt finden', description: 'Finden Sie ein Produkt mit dem absolut höchsten Gesamtzuckergehalt im gesamten Datensatz und klicken Sie auf seine Glyphe.', mode: 'semantic-zoom' },
  { id: 'id-2-z', type: TaskType.Identification, name: 'Höchsten Gesamtproteingehalt finden', description: 'Finden Sie ein Produkt mit dem absolut höchsten Gesamtproteingehalt im gesamten Datensatz und klicken Sie auf seine Glyphe.', mode: 'semantic-zoom' },
  { id: 'id-3-z', type: TaskType.Identification, name: 'Höchsten Gesamtfettgehalt finden', description: 'Finden Sie ein Produkt mit dem absolut höchsten Gesamtfettgehalt im gesamten Datensatz und klicken Sie auf seine Glyphe.', mode: 'semantic-zoom' },
  { id: 'id-4-z', type: TaskType.Identification, name: 'Höchsten Kalorienwert finden', description: 'Finden Sie ein Produkt mit dem absolut höchsten Kalorienwert im gesamten Datensatz und klicken Sie auf seine Glyphe.', mode: 'semantic-zoom' },
  { id: 'cmp-1-z', type: TaskType.Comparison, name: 'Hoher Protein + max Zucker', description: 'Finden Sie ein Produkt bei dem hoher Proteingehalt auf gleichzeitig maximalen Zuckergehalt trifft. Klicken Sie auf die Glyphe.', mode: 'semantic-zoom' },
  { id: 'cmp-2-z', type: TaskType.Comparison, name: 'Max Fett + max Ballaststoff', description: 'Finden Sie ein Produkt mit maximalem Gesamtfettgehalt bei gleichzeitig maximalem Ballaststoffgehalt. Klicken Sie auf die Glyphe.', mode: 'semantic-zoom' },
  { id: 'cmp-3-z', type: TaskType.Comparison, name: 'Versteckter Dickmacher', description: 'Finden Sie ein Produkt, dessen Glyphe das Profil eines \'versteckten Dickmachers\' zeigt: viel Zucker und viel Fett, während Ballaststoffe gegen Null gehen.', mode: 'semantic-zoom' },
  { id: 'cmp-4-z', type: TaskType.Comparison, name: 'Kalorien+Fett max, Protein null', description: 'Finden Sie ein Produkt, bei dem Kalorien und Fett maximal ausgeprägt sind, während Protein nahezu Null ist.', mode: 'semantic-zoom' },
  { id: 'pr-1-z', type: TaskType.PatternRecognition, name: 'Protein+Ballaststoffe, Zucker null', description: 'Finden Sie ein Produkt, mit sehr viel Protein und sehr vielen Ballaststoffen, während Zucker nahezu Null ist.', mode: 'semantic-zoom' },
  { id: 'pr-2-z', type: TaskType.PatternRecognition, name: 'Zucker+Kalorien, Fett null', description: 'Finden Sie ein Produkt, dessen Glyphe ein Profil mit sehr viel Zucker und sehr vielen Kalorien, während Fett nahezu Null ist.', mode: 'semantic-zoom' },
  { id: 'pr-3-z', type: TaskType.PatternRecognition, name: 'Fett, Zucker+Ballaststoffe null', description: 'Finden sie ein Produkt, dessen Glyphe ein Profil mit sehr viel Fett hat, während Zucker und Ballaststoffe nahezu null sind.', mode: 'semantic-zoom' },
  { id: 'pr-4-z', type: TaskType.PatternRecognition, name: 'Ballaststoffe, Fett+Protein null', description: 'Finden Sie ein Produkt, dessen Glyphe ein Profil mit sehr vielen Ballaststoffen zeigt, während Fett und Protein nahezu Null sind.', mode: 'semantic-zoom' },
  { id: 'pr-5-z', type: TaskType.PatternRecognition, name: 'Fett+Ballaststoffe max, Rest null', description: 'Finden Sie eine Glyphe, bei der die beiden Attribute Fett und Ballaststoffe maximal ausgeprägt sind, während Protein, Zucker und Kalorien gegen Null gehen.', mode: 'semantic-zoom' },
  { id: 'pr-6-z', type: TaskType.PatternRecognition, name: 'Kalorien+Fett max, Rest null', description: 'Finden Sie eine Glyphe, bei der die beiden Attribute Kalorien und Fett maximal ausgeprägt sind, während Protein und Zucker und Ballaststoffe gegen Null gehen, und klicken Sie sie an.', mode: 'semantic-zoom' },
  { id: 'pr-7-z', type: TaskType.PatternRecognition, name: 'Protein+Ballaststoffe max, Rest null', description: 'Finden Sie eine Glyphe bei der die beiden Attribute Protein und Ballaststoffe maximal ausgeprägt sind, während Fett, Zucker und Kalorien gegen Null gehen.', mode: 'semantic-zoom' },
  { id: 'pr-8-z', type: TaskType.PatternRecognition, name: 'Kalorien+Zucker max, Rest null', description: 'Finden Sie eine Glyphe, bei der die beiden Attribute und Kalorien und Zucker maximal ausgeprägt sind, während Fett, Protein und Ballaststoffe gegen Null gehen.', mode: 'semantic-zoom' },
  { id: 'ma-1-z', type: TaskType.MultivariateAnalysis, name: 'Proteinreichste, wenigste Ballaststoffe', description: 'Betrachten Sie die Gruppe der proteinreichsten Produkte: Klicken Sie auf ein Produkt aus dieser Spitzengruppe, das die wenigsten Ballaststoffe hat.', mode: 'semantic-zoom' },
  { id: 'ma-2-z', type: TaskType.MultivariateAnalysis, name: 'Ballaststoffreichste, meiste Protein', description: 'Suchen Sie unter den ballaststoffreichsten Produkten nach einem, das gleichzeitig das meiste Protein besitzt, und klicken Sie es an.', mode: 'semantic-zoom' },
  { id: 'ma-3-z', type: TaskType.MultivariateAnalysis, name: 'Energielieferant ohne Zucker', description: 'Finden Sie ein Produkt, das als reiner Energielieferant ohne Zucker fungiert (hohe Kalorien und hohes Fett, aber Gesamtzucker gegen Null), und klicken Sie auf die Glyphe.', mode: 'semantic-zoom' },
  { id: 'ma-4-z', type: TaskType.MultivariateAnalysis, name: 'Höchster Ballaststoff, höchster Zucker', description: 'Betrachten Sie die Gruppe der Produkte mit dem absolut höchsten Ballaststoffgehalt. Klicken Sie auf ein Produkt aus dieser Spitzengruppe, das den höchsten Gesamtzuckergehalt aufweist.', mode: 'semantic-zoom' },
];

const TASK_DEFINITIONS_MAGIC_LENS: TaskDefinition[] = [
  { id: 'id-1-l', type: TaskType.Identification, name: 'Höchsten Proteingehalt finden', description: 'Finden Sie ein Produkt mit dem absolut höchsten Proteingehalt im gesamten Datensatz und klicken Sie auf seine Glyphe.', mode: 'magic-lens' },
  { id: 'id-2-l', type: TaskType.Identification, name: 'Höchsten Ballaststoffgehalt finden', description: 'Finden Sie ein Produkt mit dem absolut höchsten Ballaststoffgehalt im gesamten Datensatz und klicken Sie auf seine Glyphe.', mode: 'magic-lens' },
  { id: 'id-3-l', type: TaskType.Identification, name: 'Niedrigste Kalorienanzahl finden', description: 'Finden Sie ein Produkt mit der absolut niedrigsten Kalorienanzahl im gesamten Datensatz und klicken Sie auf seine Glyphe.', mode: 'magic-lens' },
  { id: 'id-4-l', type: TaskType.Identification, name: 'Niedrigsten Gesamtfettgehalt finden', description: 'Finden Sie ein Produkt mit dem absolut niedrigsten Gesamtfettgehalt im gesamten Datensatz und klicken Sie auf seine Glyphe.', mode: 'magic-lens' },
  { id: 'cmp-1-l', type: TaskType.Comparison, name: 'Gruppe: Hoher Protein, geringste Kalorien', description: 'Suchen Sie nach der Gruppe von Produkten mit sehr hohem Proteingehalt und klicken Sie auf diejenige Glyphe aus dieser Gruppe, die den geringsten Kalorienwert aufweist.', mode: 'magic-lens' },
  { id: 'cmp-2-l', type: TaskType.Comparison, name: 'Gruppe: Hoher Ballaststoff, geringste Kalorien', description: 'Suchen Sie nach der Gruppe von Produkten mit sehr hohem Ballaststoffgehalt und klicken Sie auf diejenige Glyphe aus dieser Gruppe, die den geringsten Kalorienwert aufweist.', mode: 'magic-lens' },
  { id: 'cmp-3-l', type: TaskType.Comparison, name: 'Gruppe: Hohes Fett, höchster Zucker', description: 'Suchen Sie nach der Gruppe von Produkten mit hohem Gesamtfettgehalt und klicken Sie auf diejenige Glyphe in diesem Bereich, die den optisch höchsten Zuckeranteil aufweist.', mode: 'magic-lens' },
  { id: 'cmp-4-l', type: TaskType.Comparison, name: 'Gruppe: Hoher Protein, höchster Ballaststoff', description: 'Suchen Sie nach der Gruppe von Produkten mit hohem Gesamtproteingehalt und klicken Sie auf diejenige Glyphe in diesem Bereich, die den optisch höchsten Ballaststoffanteil aufweist.', mode: 'magic-lens' },
  { id: 'pr-1-l', type: TaskType.PatternRecognition, name: 'Verhältnis: Kalorien vs. Fett', description: 'Finden Sie ein Produkt, bei dem das Verhältnis von Kalorien zu Gesamtfett am stärksten auseinandergeht (maximal viele Kalorien bei minimalem Fett), und klicken Sie es an.', mode: 'magic-lens' },
  { id: 'pr-2-l', type: TaskType.PatternRecognition, name: 'Verhältnis: Protein vs. Ballaststoffe', description: 'Finden Sie ein Produkt, bei dem das Verhältnis von Proteingehalt zu Ballaststoffen am stärksten auseinandergeht (maximal viel Protein bei minimalen Ballaststoffen), und klicken Sie es an.', mode: 'magic-lens' },
  { id: 'pr-3-l', type: TaskType.PatternRecognition, name: 'Magerer Fitness-Snack', description: 'Finden Sie ein Produkt, dessen Glyphe das Profil eines \'Mageren Fitness-Snacks\' zeigt: sehr viel Protein, während Fett und Zucker nahezu Null sind.', mode: 'magic-lens' },
  { id: 'pr-4-l', type: TaskType.PatternRecognition, name: 'Zucker+Ballaststoffe max, Fett null', description: 'Finden Sie ein Produkt, bei dem Zucker und Ballaststoffe maximal ausgeprägt sind, während Fett nahezu Null ist.', mode: 'magic-lens' },
  { id: 'pr-5-l', type: TaskType.PatternRecognition, name: 'Kalorien+Protein max, Rest null', description: 'Finden Sie eine Glyphe, bei der die beiden Attribute Kalorien und Protein maximal ausgeprägt sind, während Fett, Zucker und Ballaststoffe gegen Null gehen.', mode: 'magic-lens' },
  { id: 'pr-6-l', type: TaskType.PatternRecognition, name: 'Zucker+Ballaststoffe max, Rest null', description: 'Finden Sie eine Glyphe, bei der die beiden Attribute Zucker und Ballaststoffe maximal ausgeprägt sind, während Fett und Protein und Kalorien gegen Null gehen, und klicken Sie sie an.', mode: 'magic-lens' },
  { id: 'pr-7-l', type: TaskType.PatternRecognition, name: 'Protein+Zucker max, Rest null', description: 'Finden Sie eine Glyphe, bei der die beiden Attribute Protein und Zucker maximal ausgeprägt sind, während Fett, Ballaststoffe und Kalorien gegen Null gehen.', mode: 'magic-lens' },
  { id: 'pr-8-l', type: TaskType.PatternRecognition, name: 'Zucker+Fett max, Rest null', description: 'Finden Sie eine Glyphe, bei der die beiden Attribute Zucker und Fett maximal ausgeprägt sind, während Protein, Ballaststoffe und Kalorien gegen Null gehen.', mode: 'magic-lens' },
  { id: 'ma-1-l', type: TaskType.MultivariateAnalysis, name: 'Zuckerreichste, wenigste Kalorien', description: 'Betrachten Sie die Gruppe der zuckerreichsten Produkte: Klicken Sie auf ein Produkt aus dieser Spitzengruppe, das die wenigsten Kalorien hat.', mode: 'magic-lens' },
  { id: 'ma-2-l', type: TaskType.MultivariateAnalysis, name: 'Proteinreichste, meiste Fett', description: 'Suchen Sie unter den proteinreichsten Produkten nach einem, das gleichzeitig das meiste Fett besitzt, und klicken Sie es an.', mode: 'magic-lens' },
  { id: 'ma-3-l', type: TaskType.MultivariateAnalysis, name: 'Ketogene Ernährung', description: 'Finden Sie ein Produkt, das sich hervorragend für eine rein ketogene Ernährung eignet (maximaler Fettgehalt bei nahezu null Kohlenhydraten/Zucker), und klicken Sie auf die Glyphe.', mode: 'magic-lens' },
  { id: 'ma-4-l', type: TaskType.MultivariateAnalysis, name: 'Höchster Fettgehalt, wenigste Kalorien', description: 'Betrachten Sie die Gruppe der Produkte mit dem absolut höchsten Fettgehalt. Klicken Sie auf ein Produkt aus dieser Spitzengruppe, das die wenigsten Kalorien aufweist.', mode: 'magic-lens' },
];

let nextSessionId = 1;

@Injectable({ providedIn: 'root' })
export class TaskLoggerService {
  private currentTaskDefinitions: TaskDefinition[] = [
    ...TASK_DEFINITIONS_SEMANTIC_ZOOM,
    ...TASK_DEFINITIONS_MAGIC_LENS,
  ];

  private currentTaskIndexSubject = new BehaviorSubject<number>(-1);
  currentTaskIndex$: Observable<number> = this.currentTaskIndexSubject.asObservable();

  private sessionSubject = new BehaviorSubject<TaskSession>(this.createSession());
  session$: Observable<TaskSession> = this.sessionSubject.asObservable();

  private isRunningSubject = new BehaviorSubject<boolean>(false);
  isRunning$: Observable<boolean> = this.isRunningSubject.asObservable();

  private studyStartedSubject = new BehaviorSubject<boolean>(false);
  studyStarted$: Observable<boolean> = this.studyStartedSubject.asObservable();

  lastZoomLevel = 1;
  lastMousePos = { x: 0, y: 0 };
  lensWasActive = false;

  private _currentTimestamp = '';
  private _currentAlgorithm = '';

  set currentTimestamp(value: string) { this._currentTimestamp = value; }
  get currentTimestamp(): string { return this._currentTimestamp; }

  set currentAlgorithm(value: string) { this._currentAlgorithm = value; }
  get currentAlgorithm(): string { return this._currentAlgorithm; }

  constructor(private dataLoader: DataLoaderService) {}

  get taskDefinitions(): TaskDefinition[] {
    return this.currentTaskDefinitions;
  }

  get currentTaskIndex(): number {
    return this.currentTaskIndexSubject.getValue();
  }

  get currentTaskDef(): TaskDefinition | null {
    const idx = this.currentTaskIndex;
    if (idx < 0 || idx >= this.currentTaskDefinitions.length) return null;
    return this.currentTaskDefinitions[idx];
  }

  get currentMode(): TaskMode | null {
    return this.currentTaskDef?.mode ?? null;
  }

  get currentRun(): TaskRun | null {
    const session = this.sessionSubject.getValue();
    const idx = this.currentTaskIndex;
    if (idx < 0 || idx >= session.runs.length) return null;
    return session.runs[idx];
  }

  get isRunning(): boolean {
    return this.isRunningSubject.getValue();
  }

  get studyStarted(): boolean {
    return this.studyStartedSubject.getValue();
  }

  get session(): TaskSession {
    return this.sessionSubject.getValue();
  }

  private createSession(): TaskSession {
    return {
      id: 'session-' + nextSessionId++,
      startTime: Date.now(),
      runs: this.currentTaskDefinitions.map(t => ({
        taskId: t.id,
        taskType: t.type,
        taskName: t.name,
        taskDescription: t.description,
        mode: t.mode,
        startTime: 0,
        zoomDistance: 0,
        lensDistance: 0,
        panDistance: 0,
        completed: false,
        solutionGlyphId: null,
        events: [],
        timestamp: '',
        algorithm: '',
        accuracy: null,
        deviation: null,
        expectedPositionDistance: null,
      }))
    };
  }

  startStudy(participantId: string, startMode: TaskMode): void {
    if (startMode === 'magic-lens') {
      this.currentTaskDefinitions = [
        ...TASK_DEFINITIONS_MAGIC_LENS,
        ...TASK_DEFINITIONS_SEMANTIC_ZOOM,
      ];
    } else {
      this.currentTaskDefinitions = [
        ...TASK_DEFINITIONS_SEMANTIC_ZOOM,
        ...TASK_DEFINITIONS_MAGIC_LENS,
      ];
    }

    this.sessionSubject.next(this.createSession());
    this.sessionSubject.getValue().participantId = participantId;
    this.sessionSubject.getValue().startMode = startMode;
    this.sessionSubject.getValue().startTime = Date.now();

    this.studyStartedSubject.next(true);
    this.selectTask(0);
    this.startCurrentTask();
  }

  selectTask(index: number): void {
    if (index < 0 || index >= this.currentTaskDefinitions.length) return;
    this.currentTaskIndexSubject.next(index);
  }

  startCurrentTask(): void {
    const run = this.currentRun;
    if (!run || run.completed) return;

    run.startTime = Date.now();
    run.events = [];
    run.zoomDistance = 0;
    run.lensDistance = 0;
    run.panDistance = 0;
    run.solutionGlyphId = null;
    run.timestamp = this._currentTimestamp;
    run.algorithm = this._currentAlgorithm;
    run.accuracy = null;
    run.deviation = null;
    run.expectedPositionDistance = null;
    this.lastZoomLevel = 1;
    this.lastMousePos = { x: 0, y: 0 };
    this.lensWasActive = false;
    this.isRunningSubject.next(true);
    this.logEvent('task-start');
    this.sessionSubject.next(this.sessionSubject.getValue());
  }

  completeCurrentTask(): void {
    const run = this.currentRun;
    if (!run || run.startTime === 0) return;

    run.endTime = Date.now();
    run.duration = run.endTime - run.startTime;
    run.completed = true;
    this.isRunningSubject.next(false);
    this.logEvent('task-end');
    this.sessionSubject.next(this.sessionSubject.getValue());
  }

  nextTask(): void {
    this.completeCurrentTask();
    const next = this.currentTaskIndex + 1;
    if (next < this.currentTaskDefinitions.length) {
      this.selectTask(next);
      this.startCurrentTask();
    } else {
      this.sessionSubject.getValue().endTime = Date.now();
      this.sessionSubject.next(this.sessionSubject.getValue());
      this.currentTaskIndexSubject.next(this.currentTaskDefinitions.length);
    }
  }

  logSolution(glyphId: string): void {
    const run = this.currentRun;
    if (!run || !this.isRunning) return;

    run.solutionGlyphId = glyphId;
    this.logEvent('solution', { glyphId });
    this.sessionSubject.next(this.sessionSubject.getValue());
  }

  logZoomChange(oldZoom: number, newZoom: number): void {
    const run = this.currentRun;
    if (!run || !this.isRunning) return;

    const distance = Math.abs(newZoom - oldZoom);
    run.zoomDistance += distance;
    this.lastZoomLevel = newZoom;
    this.logEvent('zoom', { oldZoom, newZoom, distance });
  }

  logPan(dx: number, dy: number): void {
    const run = this.currentRun;
    if (!run || !this.isRunning) return;

    const distance = Math.sqrt(dx * dx + dy * dy);
    run.panDistance += distance;
    this.logEvent('pan', { dx, dy, distance });
  }

  logLensMove(x: number, y: number): void {
    const run = this.currentRun;
    if (!run || !this.isRunning) return;

    const dx = x - this.lastMousePos.x;
    const dy = y - this.lastMousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    run.lensDistance += distance;
    this.lastMousePos = { x, y };
    this.logEvent('lens-move', { x, y, distance });
  }

  logLensToggle(active: boolean): void {
    const run = this.currentRun;
    if (!run || !this.isRunning) return;

    this.lensWasActive = active;
    this.logEvent('lens-toggle', { active });
  }

  logSelect(objectIds?: string[]): void {
    this.logEvent('select', objectIds ? { objectIds } : undefined);
  }

  resetSession(): void {
    this.currentTaskDefinitions = [
      ...TASK_DEFINITIONS_SEMANTIC_ZOOM,
      ...TASK_DEFINITIONS_MAGIC_LENS,
    ];
    this.currentTaskIndexSubject.next(-1);
    this.isRunningSubject.next(false);
    this.studyStartedSubject.next(false);
    this.lastZoomLevel = 1;
    this.lastMousePos = { x: 0, y: 0 };
    this.lensWasActive = false;
    this.expectedAnswerInfoMap = null;
    this.sessionSubject.next(this.createSession());
  }

  private getGlyphPosition(glyphId: string, timestamp: string, algorithm: string): Coordinates | null {
    const glyphMap = this.dataLoader.getGlyphDataSync();
    if (!glyphMap) return null;
    const glyph = glyphMap.get(glyphId);
    if (!glyph) return null;
    try {
      return glyph.getPosition(timestamp, algorithm);
    } catch {
      return null;
    }
  }

  private computeAccuracy(run: TaskRun): boolean | null {
    const info = this.getExpectedInfo(run.taskId);
    if (!info || !run.solutionGlyphId) return null;
    return run.solutionGlyphId === info.glyphId;
  }

  private computeDeviation(run: TaskRun): number | null {
    if (!run.solutionGlyphId) return null;
    const info = this.getExpectedInfo(run.taskId);
    if (!info) return null;
    const userScore = this.computeScoreForTask(run.taskId, run.solutionGlyphId);
    if (userScore === null) return null;
    const range = info.maxScore - info.minScore;
    if (range === 0) return 0;
    return Math.abs(info.optimalScore - userScore) / range;
  }

  private computeExpectedPositionDistance(run: TaskRun): number | null {
    if (!run.solutionGlyphId) return null;
    const info = this.getExpectedInfo(run.taskId);
    if (!info) return null;
    const expectedPos = this.getGlyphPosition(info.glyphId, run.timestamp, run.algorithm);
    const solutionPos = this.getGlyphPosition(run.solutionGlyphId, run.timestamp, run.algorithm);
    if (!expectedPos || !solutionPos) return null;
    const distance = Math.hypot(solutionPos.x - expectedPos.x, solutionPos.y - expectedPos.y);
    const maxDistance = this.getMaxPositionDistance(run.timestamp, run.algorithm);
    if (maxDistance === 0) return 0;
    return Math.min(100, (distance / maxDistance) * 100);
  }

  private getMaxPositionDistance(timestamp: string, algorithm: string): number {
    const glyphMap = this.dataLoader.getGlyphDataSync();
    if (!glyphMap || glyphMap.size === 0) return 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    glyphMap.forEach((glyph) => {
      try {
        const pos = glyph.getPosition(timestamp, algorithm);
        if (pos) {
          if (pos.x < minX) minX = pos.x;
          if (pos.x > maxX) maxX = pos.x;
          if (pos.y < minY) minY = pos.y;
          if (pos.y > maxY) maxY = pos.y;
        }
      } catch {
      }
    });
    if (minX === Infinity || maxX === -Infinity) return 0;
    return Math.hypot(maxX - minX, maxY - minY);
  }

  private expectedAnswerInfoMap: Map<string, TaskExpectedInfo> | null = null;
  private readonly FID = { PROTEIN: '63', CALORIES: '11', SUGAR: '77', FAT: '76', FIBER: '22' };

  private getFeatureVal(id: string, feature: string): number {
    const glyphMap = this.dataLoader.getGlyphDataSync();
    return glyphMap?.get(id)?.features?.['1']?.[feature] ?? 0;
  }

  private computeScoreForTask(taskId: string, glyphId: string): number | null {
    const F = this.FID;
    const val = (id: string, f: string) => this.getFeatureVal(id, f);
    const fns: Record<string, (id: string) => number> = {
      'id-1-z': id => val(id, F.SUGAR),
      'id-2-z': id => val(id, F.PROTEIN),
      'id-3-z': id => val(id, F.FAT),
      'id-4-z': id => val(id, F.CALORIES),
      'cmp-1-z': id => val(id, F.PROTEIN) + val(id, F.SUGAR),
      'cmp-2-z': id => val(id, F.FAT) + val(id, F.FIBER),
      'cmp-3-z': id => val(id, F.SUGAR) + val(id, F.FAT) - val(id, F.FIBER),
      'cmp-4-z': id => val(id, F.CALORIES) + val(id, F.FAT) - val(id, F.PROTEIN),
      'pr-1-z': id => val(id, F.PROTEIN) + val(id, F.FIBER) - val(id, F.SUGAR),
      'pr-2-z': id => val(id, F.SUGAR) + val(id, F.CALORIES) - val(id, F.FAT),
      'pr-3-z': id => val(id, F.FAT) - val(id, F.SUGAR) - val(id, F.FIBER),
      'pr-4-z': id => val(id, F.FIBER) - val(id, F.FAT) - val(id, F.PROTEIN),
      'pr-5-z': id => val(id, F.FAT) + val(id, F.FIBER) - val(id, F.PROTEIN) - val(id, F.SUGAR) - val(id, F.CALORIES),
      'pr-6-z': id => val(id, F.CALORIES) + val(id, F.FAT) - val(id, F.PROTEIN) - val(id, F.SUGAR) - val(id, F.FIBER),
      'pr-7-z': id => val(id, F.PROTEIN) + val(id, F.FIBER) - val(id, F.FAT) - val(id, F.SUGAR) - val(id, F.CALORIES),
      'pr-8-z': id => val(id, F.CALORIES) + val(id, F.SUGAR) - val(id, F.FAT) - val(id, F.PROTEIN) - val(id, F.FIBER),
      'ma-1-z': id => val(id, F.FIBER),
      'ma-2-z': id => val(id, F.PROTEIN),
      'ma-3-z': id => val(id, F.CALORIES) + val(id, F.FAT) - val(id, F.SUGAR),
      'ma-4-z': id => val(id, F.SUGAR),
      'id-1-l': id => val(id, F.PROTEIN),
      'id-2-l': id => val(id, F.FIBER),
      'id-3-l': id => -val(id, F.CALORIES),
      'id-4-l': id => -val(id, F.FAT),
      'cmp-1-l': id => val(id, F.CALORIES),
      'cmp-2-l': id => val(id, F.CALORIES),
      'cmp-3-l': id => val(id, F.SUGAR),
      'cmp-4-l': id => val(id, F.FIBER),
      'pr-1-l': id => val(id, F.CALORIES) / (val(id, F.FAT) + 1),
      'pr-2-l': id => val(id, F.PROTEIN) / (val(id, F.FIBER) + 1),
      'pr-3-l': id => val(id, F.PROTEIN) - val(id, F.FAT) - val(id, F.SUGAR),
      'pr-4-l': id => val(id, F.SUGAR) + val(id, F.FIBER) - val(id, F.FAT),
      'pr-5-l': id => val(id, F.CALORIES) + val(id, F.PROTEIN) - val(id, F.FAT) - val(id, F.SUGAR) - val(id, F.FIBER),
      'pr-6-l': id => val(id, F.SUGAR) + val(id, F.FIBER) - val(id, F.FAT) - val(id, F.PROTEIN) - val(id, F.CALORIES),
      'pr-7-l': id => val(id, F.PROTEIN) + val(id, F.SUGAR) - val(id, F.FAT) - val(id, F.FIBER) - val(id, F.CALORIES),
      'pr-8-l': id => val(id, F.SUGAR) + val(id, F.FAT) - val(id, F.PROTEIN) - val(id, F.FIBER) - val(id, F.CALORIES),
      'ma-1-l': id => val(id, F.CALORIES),
      'ma-2-l': id => val(id, F.FAT),
      'ma-3-l': id => val(id, F.FAT) - val(id, F.SUGAR),
      'ma-4-l': id => val(id, F.CALORIES),
    };
    const fn = fns[taskId];
    return fn ? fn(glyphId) : null;
  }

  private computeExpectedAnswerInfo(): Map<string, TaskExpectedInfo> {
    const infoMap = new Map<string, TaskExpectedInfo>();
    const glyphMap = this.dataLoader.getGlyphDataSync();
    if (!glyphMap) return infoMap;

    const F = this.FID;
    const val = (id: string, f: string) => this.getFeatureVal(id, f);

    const topPercentile = (feature: string, pct: number): string[] => {
      const entries: { id: string; v: number }[] = [];
      glyphMap.forEach((_, id) => entries.push({ id, v: val(id, feature) }));
      entries.sort((a, b) => b.v - a.v);
      const count = Math.max(1, Math.floor(entries.length * pct / 100));
      return entries.slice(0, count).map(e => e.id);
    };

    const top5Protein = topPercentile(F.PROTEIN, 5);
    const top5Fiber = topPercentile(F.FIBER, 5);
    const top5Sugar = topPercentile(F.SUGAR, 5);
    const top5Fat = topPercentile(F.FAT, 5);

    interface TaskConfig {
      fn: (id: string) => number;
      subset?: string[];
      isMaximization: boolean;
    }

    const taskConfigs: Record<string, TaskConfig> = {
      'id-1-z': { fn: id => val(id, F.SUGAR), isMaximization: true },
      'id-2-z': { fn: id => val(id, F.PROTEIN), isMaximization: true },
      'id-3-z': { fn: id => val(id, F.FAT), isMaximization: true },
      'id-4-z': { fn: id => val(id, F.CALORIES), isMaximization: true },
      'cmp-1-z': { fn: id => val(id, F.PROTEIN) + val(id, F.SUGAR), isMaximization: true },
      'cmp-2-z': { fn: id => val(id, F.FAT) + val(id, F.FIBER), isMaximization: true },
      'cmp-3-z': { fn: id => val(id, F.SUGAR) + val(id, F.FAT) - val(id, F.FIBER), isMaximization: true },
      'cmp-4-z': { fn: id => val(id, F.CALORIES) + val(id, F.FAT) - val(id, F.PROTEIN), isMaximization: true },
      'pr-1-z': { fn: id => val(id, F.PROTEIN) + val(id, F.FIBER) - val(id, F.SUGAR), isMaximization: true },
      'pr-2-z': { fn: id => val(id, F.SUGAR) + val(id, F.CALORIES) - val(id, F.FAT), isMaximization: true },
      'pr-3-z': { fn: id => val(id, F.FAT) - val(id, F.SUGAR) - val(id, F.FIBER), isMaximization: true },
      'pr-4-z': { fn: id => val(id, F.FIBER) - val(id, F.FAT) - val(id, F.PROTEIN), isMaximization: true },
      'pr-5-z': { fn: id => val(id, F.FAT) + val(id, F.FIBER) - val(id, F.PROTEIN) - val(id, F.SUGAR) - val(id, F.CALORIES), isMaximization: true },
      'pr-6-z': { fn: id => val(id, F.CALORIES) + val(id, F.FAT) - val(id, F.PROTEIN) - val(id, F.SUGAR) - val(id, F.FIBER), isMaximization: true },
      'pr-7-z': { fn: id => val(id, F.PROTEIN) + val(id, F.FIBER) - val(id, F.FAT) - val(id, F.SUGAR) - val(id, F.CALORIES), isMaximization: true },
      'pr-8-z': { fn: id => val(id, F.CALORIES) + val(id, F.SUGAR) - val(id, F.FAT) - val(id, F.PROTEIN) - val(id, F.FIBER), isMaximization: true },
      'ma-1-z': { fn: id => val(id, F.FIBER), subset: top5Protein, isMaximization: false },
      'ma-2-z': { fn: id => val(id, F.PROTEIN), subset: top5Fiber, isMaximization: true },
      'ma-3-z': { fn: id => val(id, F.CALORIES) + val(id, F.FAT) - val(id, F.SUGAR), isMaximization: true },
      'ma-4-z': { fn: id => val(id, F.SUGAR), subset: top5Fiber, isMaximization: true },
      'id-1-l': { fn: id => val(id, F.PROTEIN), isMaximization: true },
      'id-2-l': { fn: id => val(id, F.FIBER), isMaximization: true },
      'id-3-l': { fn: id => -val(id, F.CALORIES), isMaximization: true },
      'id-4-l': { fn: id => -val(id, F.FAT), isMaximization: true },
      'cmp-1-l': { fn: id => val(id, F.CALORIES), subset: top5Protein, isMaximization: false },
      'cmp-2-l': { fn: id => val(id, F.CALORIES), subset: top5Fiber, isMaximization: false },
      'cmp-3-l': { fn: id => val(id, F.SUGAR), subset: top5Fat, isMaximization: true },
      'cmp-4-l': { fn: id => val(id, F.FIBER), subset: top5Protein, isMaximization: true },
      'pr-1-l': { fn: id => val(id, F.CALORIES) / (val(id, F.FAT) + 1), isMaximization: true },
      'pr-2-l': { fn: id => val(id, F.PROTEIN) / (val(id, F.FIBER) + 1), isMaximization: true },
      'pr-3-l': { fn: id => val(id, F.PROTEIN) - val(id, F.FAT) - val(id, F.SUGAR), isMaximization: true },
      'pr-4-l': { fn: id => val(id, F.SUGAR) + val(id, F.FIBER) - val(id, F.FAT), isMaximization: true },
      'pr-5-l': { fn: id => val(id, F.CALORIES) + val(id, F.PROTEIN) - val(id, F.FAT) - val(id, F.SUGAR) - val(id, F.FIBER), isMaximization: true },
      'pr-6-l': { fn: id => val(id, F.SUGAR) + val(id, F.FIBER) - val(id, F.FAT) - val(id, F.PROTEIN) - val(id, F.CALORIES), isMaximization: true },
      'pr-7-l': { fn: id => val(id, F.PROTEIN) + val(id, F.SUGAR) - val(id, F.FAT) - val(id, F.FIBER) - val(id, F.CALORIES), isMaximization: true },
      'pr-8-l': { fn: id => val(id, F.SUGAR) + val(id, F.FAT) - val(id, F.PROTEIN) - val(id, F.FIBER) - val(id, F.CALORIES), isMaximization: true },
      'ma-1-l': { fn: id => val(id, F.CALORIES), subset: top5Sugar, isMaximization: false },
      'ma-2-l': { fn: id => val(id, F.FAT), subset: top5Protein, isMaximization: true },
      'ma-3-l': { fn: id => val(id, F.FAT) - val(id, F.SUGAR), isMaximization: true },
      'ma-4-l': { fn: id => val(id, F.CALORIES), subset: top5Fat, isMaximization: false },
    };

    for (const [taskId, config] of Object.entries(taskConfigs)) {
      let minScore = Infinity;
      let maxScore = -Infinity;

      glyphMap.forEach((_, id) => {
        const s = config.fn(id);
        if (s < minScore) minScore = s;
        if (s > maxScore) maxScore = s;
      });

      let optimalId = '';
      let optimalScore = config.isMaximization ? -Infinity : Infinity;

      const candidates = config.subset || Array.from(glyphMap.keys());
      for (const id of candidates) {
        const s = config.fn(id);
        if (config.isMaximization ? s > optimalScore : s < optimalScore) {
          optimalScore = s;
          optimalId = id;
        }
      }

      infoMap.set(taskId, { glyphId: optimalId, optimalScore, minScore, maxScore });
    }

    return infoMap;
  }

  private getExpectedInfo(taskId: string): TaskExpectedInfo | null {
    if (!this.expectedAnswerInfoMap) {
      this.expectedAnswerInfoMap = this.computeExpectedAnswerInfo();
    }
    return this.expectedAnswerInfoMap.get(taskId) ?? null;
  }

  private logEvent(type: TaskEvent['type'], data?: Record<string, unknown>): void {
    const run = this.currentRun;
    if (!run) return;
    run.events.push({ timestamp: Date.now(), type, data });
  }

  exportAsJson(): string {
    const session = this.sessionSubject.getValue();
    const completed = session.runs.filter(r => r.completed);
    const totalDuration = (session.endTime ?? session.startTime) - session.startTime;
    return JSON.stringify({
      session: {
        id: session.id,
        startTime: new Date(session.startTime).toISOString(),
        endTime: session.endTime ? new Date(session.endTime).toISOString() : null,
        participantId: session.participantId || null,
        startMode: session.startMode || null,
        totalDurationMs: totalDuration,
      },
      runs: completed.map((r, idx) => {
        const info = this.getExpectedInfo(r.taskId);
        const accuracy = this.computeAccuracy(r);
        const deviation = this.computeDeviation(r);
        const expectedPositionDistance = this.computeExpectedPositionDistance(r);
        return {
          participantId: session.participantId || null,
          taskId: r.taskId,
          taskType: r.taskType,
          taskName: r.taskName,
          mode: r.mode,
          sequenceNumber: idx + 1,
          durationMs: r.duration,
          accuracy: accuracy,
          deviation: deviation !== null ? Math.round(deviation * 100) / 100 : null,
          expectedPositionDistance: expectedPositionDistance !== null ? Math.round(expectedPositionDistance * 100) / 100 : null,
          solutionGlyphId: r.solutionGlyphId,
          expectedGlyphId: info?.glyphId ?? null,
          panDistance: Math.round(r.panDistance * 100) / 100,
          zoomDistance: Math.round(r.zoomDistance * 100) / 100,
          lensDistance: r.mode === 'magic-lens' ? Math.round(r.lensDistance * 100) / 100 : 0,
          eventCount: r.events.length,
        };
      })
    }, null, 2);
  }

  exportAsCsv(): string {
    const session = this.sessionSubject.getValue();
    const completed = session.runs.filter(r => r.completed);
    const totalDuration = (session.endTime ?? session.startTime) - session.startTime;
    const infoLine = `sessionId,${session.id},totalDurationMs,${totalDuration},participantId,${session.participantId || ''}`;
    const header = 'participantId,taskId,taskType,taskName,mode,sequenceNumber,durationMs,accuracy,deviation,expectedPositionDistance,solutionGlyphId,expectedGlyphId,panDistance,zoomDistance,lensDistance,eventCount';
    const rows = completed.map((r, idx) => {
      const info = this.getExpectedInfo(r.taskId);
      const accuracy = this.computeAccuracy(r);
      const deviation = this.computeDeviation(r);
      const expectedPositionDistance = this.computeExpectedPositionDistance(r);
      return [
        session.participantId || '',
        r.taskId,
        r.taskType,
        '"' + r.taskName + '"',
        r.mode,
        idx + 1,
        r.duration || 0,
        accuracy !== null ? String(accuracy) : '',
        deviation !== null ? String(Math.round(deviation * 100) / 100) : '',
        expectedPositionDistance !== null ? String(Math.round(expectedPositionDistance * 100) / 100) : '',
        r.solutionGlyphId || '',
        info?.glyphId ?? '',
        Math.round(r.panDistance * 100) / 100,
        Math.round(r.zoomDistance * 100) / 100,
        r.mode === 'magic-lens' ? Math.round(r.lensDistance * 100) / 100 : 0,
        r.events.length
      ].join(',');
    });
    return infoLine + '\n\n' + header + '\n' + rows.join('\n');
  }

  downloadResults(): void {
    const json = this.exportAsJson();
    const csv = this.exportAsCsv();
    const session = this.sessionSubject.getValue();

    const jsonBlob = new Blob([json], { type: 'application/json' });
    const csvBlob = new Blob([csv], { type: 'text/csv' });

    const jsonUrl = URL.createObjectURL(jsonBlob);
    const csvUrl = URL.createObjectURL(csvBlob);

    const jsonA = document.createElement('a');
    jsonA.href = jsonUrl;
    jsonA.download = 'task-session-' + session.id + '.json';
    jsonA.click();
    URL.revokeObjectURL(jsonUrl);

    const csvA = document.createElement('a');
    csvA.href = csvUrl;
    csvA.download = 'task-session-' + session.id + '.csv';
    csvA.click();
    URL.revokeObjectURL(csvUrl);
  }
}
