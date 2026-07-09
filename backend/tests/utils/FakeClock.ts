import { vi } from "vitest";

export class FakeClock {
    public static useFakeTimers(): void {
        vi.useFakeTimers();
    }

    public static useRealTimers(): void {
        vi.useRealTimers();
    }

    /**
     * Advances fake timers by specified milliseconds, resolving macro queues.
     */
    public static async advanceBy(ms: number): Promise<void> {
        await vi.advanceTimersByTimeAsync(ms);
    }
}
