export interface ReplayEvent {
  readonly timestamp: number; // ms from start
  readonly key: string;
  readonly correct: boolean;
}

export class ReplayRecorder {
  private events: ReplayEvent[] = [];
  private startTime: number | null = null;

  start(): void {
    this.events = [];
    this.startTime = Date.now();
  }

  record(key: string, correct: boolean): void {
    if (this.startTime === null) return;
    this.events.push({
      timestamp: Date.now() - this.startTime,
      key,
      correct,
    });
  }

  stop(): readonly ReplayEvent[] {
    return [...this.events];
  }

  getDuration(): number {
    if (this.events.length === 0) return 0;
    return this.events[this.events.length - 1].timestamp;
  }

  reset(): void {
    this.events = [];
    this.startTime = null;
  }
}

export class ReplayPlayer {
  private events: readonly ReplayEvent[];
  private currentIndex = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private onEvent: (event: ReplayEvent, index: number) => void;
  private onComplete: () => void;
  private speed: number;

  constructor(
    events: readonly ReplayEvent[],
    onEvent: (event: ReplayEvent, index: number) => void,
    onComplete: () => void,
    speed = 1
  ) {
    this.events = events;
    this.onEvent = onEvent;
    this.onComplete = onComplete;
    this.speed = speed;
  }

  play(): void {
    this.currentIndex = 0;
    this.scheduleNext();
  }

  private scheduleNext(): void {
    if (this.currentIndex >= this.events.length) {
      this.onComplete();
      return;
    }
    const event = this.events[this.currentIndex];
    const prevTime = this.currentIndex > 0 ? this.events[this.currentIndex - 1].timestamp : 0;
    const delay = (event.timestamp - prevTime) / this.speed;

    this.timer = setTimeout(() => {
      this.onEvent(event, this.currentIndex);
      this.currentIndex++;
      this.scheduleNext();
    }, delay);
  }

  pause(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  stop(): void {
    this.pause();
    this.currentIndex = 0;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }
}
