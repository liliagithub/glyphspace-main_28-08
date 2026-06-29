import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
}

export interface TaskSession {
  id: string;
  startTime: number;
  endTime?: number;
  participantId?: string;
  startMode?: TaskMode;
  runs: TaskRun[];
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
  { id: 'pr-1-l', type: TaskType.PatternRecognition, name: 'Verhältnis: Kalorien vs. Fett', description: 'Finden Sie das Produkt, bei dem das Verhältnis von Kalorien zu Gesamtfett am stärksten auseinandergeht (maximal viele Kalorien bei minimalem Fett), und klicken Sie es an.', mode: 'magic-lens' },
  { id: 'pr-2-l', type: TaskType.PatternRecognition, name: 'Verhältnis: Protein vs. Ballaststoffe', description: 'Finden Sie das Produkt, bei dem das Verhältnis von Proteingehalt zu Ballaststoffen am stärksten auseinandergeht (maximal viel Protein bei minimalen Ballaststoffen), und klicken Sie es an.', mode: 'magic-lens' },
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
    this.sessionSubject.next(this.createSession());
  }

  private logEvent(type: TaskEvent['type'], data?: Record<string, unknown>): void {
    const run = this.currentRun;
    if (!run) return;
    run.events.push({ timestamp: Date.now(), type, data });
  }

  exportAsJson(): string {
    const session = this.sessionSubject.getValue();
    const completed = session.runs.filter(r => r.completed);
    const totalDuration = completed.reduce((sum, r) => sum + (r.duration || 0), 0);
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
        const taskDef = this.currentTaskDefinitions.find(t => t.id === r.taskId);
        return {
          taskId: r.taskId,
          taskType: r.taskType,
          taskName: r.taskName,
          mode: r.mode,
          sequenceNumber: idx + 1,
          durationMs: r.duration,
          accuracy: null,
          deviation: null,
          expectedPositionDistance: null,
          solutionGlyphId: r.solutionGlyphId,
          expectedGlyphId: taskDef?.expectedGlyphId || null,
          panDistance: Math.round(r.panDistance * 100) / 100,
          zoomDistance: Math.round(r.zoomDistance * 100) / 100,
          lensDistance: Math.round(r.lensDistance * 100) / 100,
          eventCount: r.events.length,
        };
      })
    }, null, 2);
  }

  exportAsCsv(): string {
    const session = this.sessionSubject.getValue();
    const completed = session.runs.filter(r => r.completed);
    const totalDuration = completed.reduce((sum, r) => sum + (r.duration || 0), 0);
    const infoLine = `sessionId,${session.id},totalDurationMs,${totalDuration},participantId,${session.participantId || ''}`;
    const header = 'taskId,taskType,taskName,mode,sequenceNumber,durationMs,accuracy,deviation,expectedPositionDistance,solutionGlyphId,expectedGlyphId,panDistance,zoomDistance,lensDistance,eventCount';
    const rows = completed.map((r, idx) => {
      const taskDef = this.currentTaskDefinitions.find(t => t.id === r.taskId);
      return [
        r.taskId,
        r.taskType,
        '"' + r.taskName + '"',
        r.mode,
        idx + 1,
        r.duration || 0,
        '',
        '',
        '',
        r.solutionGlyphId || '',
        taskDef?.expectedGlyphId || '',
        Math.round(r.panDistance * 100) / 100,
        Math.round(r.zoomDistance * 100) / 100,
        Math.round(r.lensDistance * 100) / 100,
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
