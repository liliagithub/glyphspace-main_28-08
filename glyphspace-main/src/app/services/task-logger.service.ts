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
  { id: 'id-1-z', type: TaskType.Identification, name: 'Niedrigstes Vitamin E finden', description: 'Identifiziere das Element mit dem niedrigsten Vitamin-E-Gehalt im Datensatz.', mode: 'semantic-zoom' },
  { id: 'id-2-z', type: TaskType.Identification, name: 'Höchsten Fettgehalt finden', description: 'Finde das Element mit dem höchsten Fettgehalt in der Projektion.', mode: 'semantic-zoom' },
  { id: 'id-3-z', type: TaskType.Identification, name: 'Mittleres Element finden', description: 'Identifiziere das Element, das dem Zentrum des Projektionsraums am nächsten liegt.', mode: 'semantic-zoom' },
  { id: 'id-4-z', type: TaskType.Identification, name: 'Höchste Kalorien finden', description: 'Finde das Element mit dem höchsten Kalorienwert im Datensatz.', mode: 'semantic-zoom' },
  { id: 'cmp-1-z', type: TaskType.Comparison, name: 'Zucker: Cluster A vs. B', description: 'Gibt es generell mehr Zucker in Cluster A oder Cluster B? Kreise die Cluster zum Vergleichen ein.', mode: 'semantic-zoom' },
  { id: 'cmp-2-z', type: TaskType.Comparison, name: 'Vitamin C pro Cluster', description: 'Vergleiche die Vitamin-C-Werte zwischen dem oberen rechten und unteren linken Cluster.', mode: 'semantic-zoom' },
  { id: 'cmp-3-z', type: TaskType.Comparison, name: 'Proteinverteilung', description: 'Welcher Cluster hat einen höheren durchschnittlichen Proteingehalt?', mode: 'semantic-zoom' },
  { id: 'cmp-4-z', type: TaskType.Comparison, name: 'Fettverteilung', description: 'Vergleiche die Fettverteilung zwischen den zwei größten Clustern.', mode: 'semantic-zoom' },
  { id: 'pr-1-z', type: TaskType.PatternRecognition, name: 'Hoher Fett- + Kaloriengehalt', description: 'Finde in Cluster B ein Element, bei dem sowohl Fett- als auch Kaloriengehalt hoch sind.', mode: 'semantic-zoom' },
  { id: 'pr-2-z', type: TaskType.PatternRecognition, name: 'Ausreißer identifizieren', description: 'Identifiziere Ausreißer-Elemente, die signifikant von den Clustern abweichen.', mode: 'semantic-zoom' },
  { id: 'pr-3-z', type: TaskType.PatternRecognition, name: 'Niedriger Zucker, hohes Fett', description: 'Finde Elemente, bei denen der Zucker niedrig, aber der Fettgehalt hoch ist.', mode: 'semantic-zoom' },
  { id: 'pr-4-z', type: TaskType.PatternRecognition, name: 'Deutliche Cluster', description: 'Identifiziere, welche Elemente das deutlichste, am besten getrennte Cluster bilden.', mode: 'semantic-zoom' },
  { id: 'ma-1-z', type: TaskType.MultivariateAnalysis, name: 'Fett vs. Vitamin A', description: 'Haben Elemente mit hohem Fettgehalt auch viel Vitamin A? Untersuche den Zusammenhang.', mode: 'semantic-zoom' },
  { id: 'ma-2-z', type: TaskType.MultivariateAnalysis, name: 'Protein vs. Zucker', description: 'Gibt es eine Korrelation zwischen Protein- und Zuckergehalt im gesamten Datensatz?', mode: 'semantic-zoom' },
  { id: 'ma-3-z', type: TaskType.MultivariateAnalysis, name: 'Vitamin E vs. Kalorien', description: 'Wie verhält sich Vitamin E zum Kalorienwert in verschiedenen Clustern?', mode: 'semantic-zoom' },
  { id: 'ma-4-z', type: TaskType.MultivariateAnalysis, name: 'Kohlenhydrate vs. Fett', description: 'Gibt es einen Zusammenhang zwischen Kohlenhydrat- und Fettgehalt?', mode: 'semantic-zoom' },
];

const TASK_DEFINITIONS_MAGIC_LENS: TaskDefinition[] = [
  { id: 'id-1-l', type: TaskType.Identification, name: 'Niedrigstes Vitamin E finden', description: 'Identifiziere das Element mit dem niedrigsten Vitamin-E-Gehalt im Datensatz.', mode: 'magic-lens' },
  { id: 'id-2-l', type: TaskType.Identification, name: 'Höchsten Fettgehalt finden', description: 'Finde das Element mit dem höchsten Fettgehalt in der Projektion.', mode: 'magic-lens' },
  { id: 'id-3-l', type: TaskType.Identification, name: 'Mittleres Element finden', description: 'Identifiziere das Element, das dem Zentrum des Projektionsraums am nächsten liegt.', mode: 'magic-lens' },
  { id: 'id-4-l', type: TaskType.Identification, name: 'Höchste Kalorien finden', description: 'Finde das Element mit dem höchsten Kalorienwert im Datensatz.', mode: 'magic-lens' },
  { id: 'cmp-1-l', type: TaskType.Comparison, name: 'Zucker: Cluster A vs. B', description: 'Gibt es generell mehr Zucker in Cluster A oder Cluster B? Kreise die Cluster zum Vergleichen ein.', mode: 'magic-lens' },
  { id: 'cmp-2-l', type: TaskType.Comparison, name: 'Vitamin C pro Cluster', description: 'Vergleiche die Vitamin-C-Werte zwischen dem oberen rechten und unteren linken Cluster.', mode: 'magic-lens' },
  { id: 'cmp-3-l', type: TaskType.Comparison, name: 'Proteinverteilung', description: 'Welcher Cluster hat einen höheren durchschnittlichen Proteingehalt?', mode: 'magic-lens' },
  { id: 'cmp-4-l', type: TaskType.Comparison, name: 'Fettverteilung', description: 'Vergleiche die Fettverteilung zwischen den zwei größten Clustern.', mode: 'magic-lens' },
  { id: 'pr-1-l', type: TaskType.PatternRecognition, name: 'Hoher Fett- + Kaloriengehalt', description: 'Finde in Cluster B ein Element, bei dem sowohl Fett- als auch Kaloriengehalt hoch sind.', mode: 'magic-lens' },
  { id: 'pr-2-l', type: TaskType.PatternRecognition, name: 'Ausreißer identifizieren', description: 'Identifiziere Ausreißer-Elemente, die signifikant von den Clustern abweichen.', mode: 'magic-lens' },
  { id: 'pr-3-l', type: TaskType.PatternRecognition, name: 'Niedriger Zucker, hohes Fett', description: 'Finde Elemente, bei denen der Zucker niedrig, aber der Fettgehalt hoch ist.', mode: 'magic-lens' },
  { id: 'pr-4-l', type: TaskType.PatternRecognition, name: 'Deutliche Cluster', description: 'Identifiziere, welche Elemente das deutlichste, am besten getrennte Cluster bilden.', mode: 'magic-lens' },
  { id: 'ma-1-l', type: TaskType.MultivariateAnalysis, name: 'Fett vs. Vitamin A', description: 'Haben Elemente mit hohem Fettgehalt auch viel Vitamin A? Untersuche den Zusammenhang.', mode: 'magic-lens' },
  { id: 'ma-2-l', type: TaskType.MultivariateAnalysis, name: 'Protein vs. Zucker', description: 'Gibt es eine Korrelation zwischen Protein- und Zuckergehalt im gesamten Datensatz?', mode: 'magic-lens' },
  { id: 'ma-3-l', type: TaskType.MultivariateAnalysis, name: 'Vitamin E vs. Kalorien', description: 'Wie verhält sich Vitamin E zum Kalorienwert in verschiedenen Clustern?', mode: 'magic-lens' },
  { id: 'ma-4-l', type: TaskType.MultivariateAnalysis, name: 'Kohlenhydrate vs. Fett', description: 'Gibt es einen Zusammenhang zwischen Kohlenhydrat- und Fettgehalt?', mode: 'magic-lens' },
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
    return JSON.stringify({
      session: {
        id: session.id,
        startTime: new Date(session.startTime).toISOString(),
        endTime: session.endTime ? new Date(session.endTime).toISOString() : null,
        participantId: session.participantId || null,
        startMode: session.startMode || null,
      },
      runs: session.runs.filter(r => r.completed).map(r => ({
        taskId: r.taskId,
        taskType: r.taskType,
        taskName: r.taskName,
        taskDescription: r.taskDescription,
        mode: r.mode,
        startTime: new Date(r.startTime).toISOString(),
        endTime: r.endTime ? new Date(r.endTime).toISOString() : null,
        durationMs: r.duration,
        zoomDistance: Math.round(r.zoomDistance * 100) / 100,
        lensDistance: Math.round(r.lensDistance * 100) / 100,
        panDistance: Math.round(r.panDistance * 100) / 100,
        solutionGlyphId: r.solutionGlyphId,
        completed: r.completed,
        eventCount: r.events.length,
      }))
    }, null, 2);
  }

  exportAsCsv(): string {
    const session = this.sessionSubject.getValue();
    const completed = session.runs.filter(r => r.completed);
    const header = 'taskId,taskType,taskName,mode,durationMs,zoomDistance,lensDistance,panDistance,solutionGlyphId,eventCount';
    const rows = completed.map(r =>
      [r.taskId, r.taskType, '"' + r.taskName + '"', r.mode, r.duration || 0,
       Math.round(r.zoomDistance * 100) / 100,
       Math.round(r.lensDistance * 100) / 100,
       Math.round(r.panDistance * 100) / 100,
       r.solutionGlyphId || '',
       r.events.length].join(',')
    );
    return header + '\n' + rows.join('\n');
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
