import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "../../../src/services/ai/rate.limiter";

describe("RateLimiter Unit Tests", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("allows immediate execution when capacity exists", async () => {
        const limiter = new RateLimiter({ requestsPerMinute: 60, tokensPerMinute: 1000 });
        const acquirePromise = limiter.acquire(10);
        vi.runAllTimers();
        await expect(acquirePromise).resolves.toBeUndefined();
    });

    it("queues and delays requests exceeding requests per minute (RPM)", async () => {
        const limiter = new RateLimiter({ requestsPerMinute: 2, tokensPerMinute: 1000 });

        let firstResolved = false;
        let secondResolved = false;
        let thirdResolved = false;

        limiter.acquire(10).then(() => { firstResolved = true; });
        limiter.acquire(10).then(() => { secondResolved = true; });

        // Let microtasks flush
        await vi.advanceTimersByTimeAsync(1);
        expect(firstResolved).toBe(true);
        expect(secondResolved).toBe(true);

        // Third request exceeds 2 RPM limit, must queue
        limiter.acquire(10).then(() => { thirdResolved = true; });
        await vi.advanceTimersByTimeAsync(1);
        expect(thirdResolved).toBe(false);

        // Fast forward 30 seconds to allow RPM bucket to refill
        await vi.advanceTimersByTimeAsync(30000);
        expect(thirdResolved).toBe(true);
    });

    it("queues and delays requests exceeding tokens per minute (TPM)", async () => {
        const limiter = new RateLimiter({ requestsPerMinute: 100, tokensPerMinute: 200 });

        let firstResolved = false;
        let secondResolved = false;

        limiter.acquire(150).then(() => { firstResolved = true; });
        await vi.advanceTimersByTimeAsync(1);
        expect(firstResolved).toBe(true);

        // Second request (100 tokens) exceeds remaining 50 tokens
        limiter.acquire(100).then(() => { secondResolved = true; });
        await vi.advanceTimersByTimeAsync(1);
        expect(secondResolved).toBe(false);

        // Refill speed is 200 tokens per minute.
        // We need 50 tokens to reach 100, which takes: 50 / (200/60) = 15 seconds.
        await vi.advanceTimersByTimeAsync(15000);
        expect(secondResolved).toBe(true);
    });
});
