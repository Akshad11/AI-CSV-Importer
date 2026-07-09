import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { RetryEngine } from "../../../src/core/retry/RetryEngine";
import { DelayStrategy } from "../../../src/core/retry/DelayStrategy";
import { RetryClassifier } from "../../../src/core/retry/RetryClassifier";
import { RetryExhaustedError, RetryTimeoutError } from "../../../src/core/retry/RetryError";

describe("RetryEngine & DelayStrategy Unit Tests", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("DelayStrategy Calculations", () => {
        it("calculates constant delay", () => {
            const delay = DelayStrategy.calculate(2, "constant", 500, 30000, 2, "none");
            expect(delay).toBe(500);
        });

        it("calculates linear delay progression", () => {
            const delay = DelayStrategy.calculate(3, "linear", 500, 30000, 200, "none");
            expect(delay).toBe(900); // 500 + (3-1)*200 = 900
        });

        it("calculates exponential delay progression", () => {
            const delay = DelayStrategy.calculate(3, "exponential", 100, 30000, 3, "none");
            expect(delay).toBe(900); // 100 * 3^2 = 900
        });

        it("caps maximum delay bounds", () => {
            const delay = DelayStrategy.calculate(10, "exponential", 1000, 5000, 2, "none");
            expect(delay).toBe(5000);
        });

        it("calculates random full jitter inside base bounds", () => {
            const delay = DelayStrategy.calculate(2, "constant", 1000, 30000, 2, "full");
            expect(delay).toBeGreaterThanOrEqual(0);
            expect(delay).toBeLessThanOrEqual(1000);
        });

        it("calculates equal jitter", () => {
            const delay = DelayStrategy.calculate(2, "constant", 1000, 30000, 2, "equal");
            expect(delay).toBeGreaterThanOrEqual(500);
            expect(delay).toBeLessThanOrEqual(1000);
        });

        it("calculates decorrelated jitter using previous sleep duration", () => {
            const delay = DelayStrategy.calculate(2, "constant", 100, 30000, 2, "decorrelated", 50);
            expect(delay).toBeGreaterThanOrEqual(100);
            expect(delay).toBeLessThanOrEqual(150); // prev (50) * 3 = 150
        });
    });

    describe("RetryClassifier Rules", () => {
        it("classifies validation schemas and JSON syntax errors as fatal", () => {
            const zodError = new Error("Zod parsing failed");
            zodError.name = "ZodError";
            expect(RetryClassifier.classify(zodError)).toBe("fatal");
        });

        it("classifies HTTP 429 and 503 as retryable", () => {
            const rateLimit: any = new Error("Quota exceeded");
            rateLimit.status = 429;
            expect(RetryClassifier.classify(rateLimit)).toBe("retryable");

            const serviceOut: any = new Error("Gateway");
            serviceOut.statusCode = 503;
            expect(RetryClassifier.classify(serviceOut)).toBe("retryable");
        });

        it("classifies client auth/forbidden errors as fatal", () => {
            const unauth: any = new Error("Forbidden");
            unauth.status = 403;
            expect(RetryClassifier.classify(unauth)).toBe("fatal");
        });

        it("classifies socket and network timeouts as retryable", () => {
            const sysError: any = new Error("Connection reset");
            sysError.code = "ECONNRESET";
            expect(RetryClassifier.classify(sysError)).toBe("retryable");
        });
    });

    describe("RetryEngine Executions", () => {
        it("returns immediately on first success attempt", async () => {
            const engine = new RetryEngine();
            let attempts = 0;
            const res = await engine.execute(async () => {
                attempts++;
                return "hello";
            });
            expect(res).toBe("hello");
            expect(attempts).toBe(1);
        });

        it("retries on temporary errors and succeeds", async () => {
            const engine = new RetryEngine();
            let attempts = 0;

            const promise = engine.execute(
                async () => {
                    attempts++;
                    if (attempts < 3) {
                        const err: any = new Error("Unavailable");
                        err.status = 503;
                        throw err;
                    }
                    return "ready";
                },
                { maxAttempts: 3, initialDelayMs: 100, delayStrategy: "constant", jitter: "none" }
            );

            await vi.advanceTimersByTimeAsync(1);
            await vi.advanceTimersByTimeAsync(100);
            await vi.advanceTimersByTimeAsync(1);
            await vi.advanceTimersByTimeAsync(100);
            await vi.advanceTimersByTimeAsync(1);

            const result = await promise;
            expect(result).toBe("ready");
            expect(attempts).toBe(3);
        });

        it("raises RetryExhaustedError when attempts exceed limits", async () => {
            const engine = new RetryEngine();
            let attempts = 0;

            const promise = engine.execute(
                async () => {
                    attempts++;
                    const err: any = new Error("Too many requests");
                    err.status = 429;
                    throw err;
                },
                { maxAttempts: 3, initialDelayMs: 100, delayStrategy: "constant", jitter: "none" }
            );
            promise.catch(() => {});

            await vi.advanceTimersByTimeAsync(1);
            await vi.advanceTimersByTimeAsync(100);
            await vi.advanceTimersByTimeAsync(1);
            await vi.advanceTimersByTimeAsync(100);
            await vi.advanceTimersByTimeAsync(1);

            await expect(promise).rejects.toThrow(RetryExhaustedError);
            expect(attempts).toBe(3);
        });

        it("fails fast on validation issues", async () => {
            const engine = new RetryEngine();
            let attempts = 0;

            const promise = engine.execute(
                async () => {
                    attempts++;
                    const err: any = new Error("Invalid Input");
                    err.name = "ValidationError";
                    throw err;
                },
                { maxAttempts: 5 }
            );

            await expect(promise).rejects.toThrow("Invalid Input");
            expect(attempts).toBe(1);
        });

        it("rejects with RetryTimeoutError on operation timeouts", async () => {
            const engine = new RetryEngine();

            const promise = engine.execute(
                async () => {
                    await new Promise(() => {});
                },
                { maxAttempts: 3, timeoutMs: 1000 }
            );
            promise.catch(() => {});

            await vi.advanceTimersByTimeAsync(1000);

            await expect(promise).rejects.toThrow(RetryTimeoutError);
        });
    });
});
