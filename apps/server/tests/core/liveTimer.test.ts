import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveTimer } from "../../src/core/session/liveTimer.js";

describe("LiveTimer (session countdown + overtime)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("goes into overtime at zero, a gift rescues it, silence ends it", () => {
    const onOvertime = vi.fn();
    const onExpired = vi.fn();
    const timer = new LiveTimer({ onOvertime, onExpired });
    timer.start({ enabled: true, initialMinutes: 1, secondsPerCoin: 30 });

    vi.advanceTimersByTime(61_000);
    expect(onOvertime).toHaveBeenCalledTimes(1);
    expect(timer.isOvertime).toBe(true);

    expect(timer.addSeconds(timer.secondsForCoins(2))).toBe(true); // rescued with 60s
    expect(timer.isOvertime).toBe(false);
    expect(timer.view().secondsRemaining).toBe(60);

    vi.advanceTimersByTime(61_000); // overtime again
    vi.advanceTimersByTime(121_000); // nobody helped
    expect(onExpired).toHaveBeenCalledTimes(1);
    timer.stop();
  });

  it("freezes while paused and does not publish a ticking endsAt", () => {
    const timer = new LiveTimer({ onOvertime: vi.fn(), onExpired: vi.fn() });
    timer.start({ enabled: true, initialMinutes: 10 });
    vi.advanceTimersByTime(60_000);
    timer.pause();
    vi.advanceTimersByTime(5 * 60_000);
    expect(timer.view()).toMatchObject({ endsAt: null, secondsRemaining: 540 });
    timer.addSeconds(60);
    timer.resume();
    expect(timer.view().secondsRemaining).toBe(600);
    timer.stop();
  });

  it("does nothing when disabled", () => {
    const timer = new LiveTimer({ onOvertime: vi.fn(), onExpired: vi.fn() });
    timer.start({ enabled: false });
    expect(timer.enabled).toBe(false);
    expect(timer.addSeconds(60)).toBe(false);
  });

  it("allows updating secondsPerCoin dynamically", () => {
    const timer = new LiveTimer({ onOvertime: vi.fn(), onExpired: vi.fn() });
    timer.start({ enabled: true, initialMinutes: 10, secondsPerCoin: 30 });
    expect(timer.secondsForCoins(2)).toBe(60);

    timer.setSecondsPerCoin(45);
    expect(timer.secondsPerCoin).toBe(45);
    expect(timer.secondsForCoins(2)).toBe(90);
    expect(timer.view().secondsPerCoin).toBe(45);
    timer.stop();
  });
});
