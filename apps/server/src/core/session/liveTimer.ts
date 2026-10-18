import { DEFAULT_LIVE_TIMER, LIVE_TIMER_GRACE_SECONDS, type LiveSessionTimer, type LiveTimerSettings } from "@tebak-kata/shared";

interface LiveTimerCallbacks {
  /** Countdown reached zero: the session should pause and wait for a gift. */
  onOvertime(graceEndsAt: Date): void;
  /** Nobody sent a gift during the grace period: the session should end. */
  onExpired(): void;
}

/**
 * The LIVE session countdown. Gifts add time (coins × secondsPerCoin); when
 * it reaches zero the session enters a 2-minute "overtime" in which a gift
 * brings it back, otherwise the session ends.
 */
export class LiveTimer {
  private settings: Required<LiveTimerSettings> = { ...DEFAULT_LIVE_TIMER };
  private running = false;
  private endsAt: Date | null = null;
  private pausedRemainingMs: number | null = null;
  private graceEndsAt: Date | null = null;
  private secondsAddedByGifts = 0;
  private ticker: NodeJS.Timeout | null = null;

  constructor(private readonly callbacks: LiveTimerCallbacks) {}

  get isOvertime(): boolean {
    return this.graceEndsAt !== null;
  }

  get enabled(): boolean {
    return this.running;
  }

  get secondsPerCoin(): number {
    return this.settings.secondsPerCoin;
  }

  setSecondsPerCoin(seconds: number): void {
    this.settings.secondsPerCoin = Math.max(0, Math.round(seconds));
  }

  start(settings: LiveTimerSettings | undefined): void {
    this.stop();
    this.settings = {
      enabled: settings?.enabled ?? DEFAULT_LIVE_TIMER.enabled,
      initialMinutes: Math.max(1, settings?.initialMinutes ?? DEFAULT_LIVE_TIMER.initialMinutes),
      secondsPerCoin: Math.max(0, settings?.secondsPerCoin ?? DEFAULT_LIVE_TIMER.secondsPerCoin),
    };
    if (!this.settings.enabled) return;
    this.running = true;
    this.endsAt = new Date(Date.now() + this.settings.initialMinutes * 60_000);
    this.ticker = setInterval(() => this.tick(), 1000);
  }

  stop(): void {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    this.running = false;
    this.endsAt = null;
    this.pausedRemainingMs = null;
    this.graceEndsAt = null;
    this.secondsAddedByGifts = 0;
  }

  /** Host paused the session: freeze the remaining time. */
  pause(): void {
    if (!this.running || this.isOvertime || !this.endsAt) return;
    this.pausedRemainingMs = Math.max(0, this.endsAt.getTime() - Date.now());
  }

  resume(): void {
    if (!this.running || this.pausedRemainingMs === null) return;
    this.endsAt = new Date(Date.now() + this.pausedRemainingMs);
    this.pausedRemainingMs = null;
  }

  /**
   * Adds time (gift or host). Returns true when this rescued the session
   * from overtime — the caller must then resume the session.
   */
  addSeconds(seconds: number): boolean {
    if (!this.running || seconds <= 0) return false;
    this.secondsAddedByGifts += seconds;
    if (this.isOvertime) {
      this.graceEndsAt = null;
      this.pausedRemainingMs = null;
      this.endsAt = new Date(Date.now() + seconds * 1000);
      return true;
    }
    if (this.pausedRemainingMs !== null) this.pausedRemainingMs += seconds * 1000;
    else if (this.endsAt) this.endsAt = new Date(this.endsAt.getTime() + seconds * 1000);
    return false;
  }

  /** Seconds a gift worth `coins` adds. */
  secondsForCoins(coins: number): number {
    return Math.max(0, coins) * this.settings.secondsPerCoin;
  }

  get currentEndsAt(): Date | null {
    return this.endsAt;
  }

  private tick(): void {
    const now = Date.now();
    if (this.graceEndsAt) {
      if (now >= this.graceEndsAt.getTime()) {
        this.graceEndsAt = null;
        this.callbacks.onExpired();
      }
      return;
    }
    if (this.pausedRemainingMs !== null || !this.endsAt) return;
    if (now >= this.endsAt.getTime()) {
      this.endsAt = null;
      this.graceEndsAt = new Date(now + LIVE_TIMER_GRACE_SECONDS * 1000);
      this.callbacks.onOvertime(this.graceEndsAt);
    }
  }

  view(): LiveSessionTimer {
    const now = Date.now();
    const remainingMs =
      this.pausedRemainingMs !== null ? this.pausedRemainingMs : this.endsAt ? this.endsAt.getTime() - now : 0;
    return {
      enabled: this.running,
      initialMinutes: this.settings.initialMinutes,
      secondsPerCoin: this.settings.secondsPerCoin,
      // While paused the countdown is frozen, so clients must not tick against endsAt.
      endsAt: this.pausedRemainingMs === null && this.endsAt ? this.endsAt.toISOString() : null,
      secondsRemaining: Math.max(0, Math.ceil(remainingMs / 1000)),
      secondsAddedByGifts: this.secondsAddedByGifts,
      isOvertimeGrace: this.isOvertime,
      graceEndsAt: this.graceEndsAt ? this.graceEndsAt.toISOString() : null,
      graceSecondsRemaining: this.graceEndsAt ? Math.max(0, Math.ceil((this.graceEndsAt.getTime() - now) / 1000)) : 0,
    };
  }
}
