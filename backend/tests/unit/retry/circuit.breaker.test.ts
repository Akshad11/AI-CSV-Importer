import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CircuitBreaker } from "../../../src/core/retry/CircuitBreaker";

describe("CircuitBreaker Unit Tests", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("starts in CLOSED state, allowing operation execution", () => {
        const cb = new CircuitBreaker(3, 5000);
        expect(cb.getState()).toBe("closed");
        expect(cb.allowExecution()).toBe(true);
    });

    it("transitions to OPEN blocking execution when consecutive failures hit threshold", () => {
        const cb = new CircuitBreaker(3, 5000);

        cb.recordFailure();
        cb.recordFailure();
        expect(cb.getState()).toBe("closed");

        cb.recordFailure();
        expect(cb.getState()).toBe("open");
        expect(cb.allowExecution()).toBe(false);
    });

    it("transitions to HALF-OPEN after the recovery cooldown expires", async () => {
        const cb = new CircuitBreaker(2, 5000);

        cb.recordFailure();
        cb.recordFailure();
        expect(cb.getState()).toBe("open");

        // Forward 5 seconds recovery timeout
        await vi.advanceTimersByTimeAsync(5000);
        expect(cb.getState()).toBe("half-open");
        expect(cb.allowExecution()).toBe(true);
    });

    it("closes back to CLOSED after 3 consecutive successes in HALF-OPEN", async () => {
        const cb = new CircuitBreaker(2, 5000);

        cb.recordFailure();
        cb.recordFailure();
        await vi.advanceTimersByTimeAsync(5000); // transitions to half-open

        cb.recordSuccess();
        cb.recordSuccess();
        expect(cb.getState()).toBe("half-open");

        cb.recordSuccess(); // Third success closes circuit
        expect(cb.getState()).toBe("closed");
    });

    it("re-trips to OPEN immediately on failure in HALF-OPEN state", async () => {
        const cb = new CircuitBreaker(2, 5000);

        cb.recordFailure();
        cb.recordFailure();
        await vi.advanceTimersByTimeAsync(5000); // half-open

        cb.recordSuccess();
        cb.recordFailure(); // failure in half-open re-trips immediately
        expect(cb.getState()).toBe("open");
    });
});
