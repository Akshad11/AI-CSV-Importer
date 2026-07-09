import { describe, expect, it } from "vitest";
import { RetryEngine } from "../../src/core/retry/RetryEngine";
import { MetricsCollector } from "../../src/core/metrics/MetricsCollector";
import { MockAIProvider } from "../mocks/MockAIProvider";

describe("Stress Tests", () => {
    it("sustains 1,000 sequential mock AI generate() calls without memory blowup", async () => {
        const CALLS = 1000;
        const provider = new MockAIProvider();
        const collector = new MetricsCollector();
        collector.start();

        const memBefore = process.memoryUsage().heapUsed;
        const start = Date.now();

        for (let i = 0; i < CALLS; i++) {
            const res = await provider.generate({ system: "sys", user: `row-${i}` });
            collector.recordCall({
                provider: res.provider,
                model: res.model,
                promptTokens: res.usage?.promptTokens ?? 100,
                completionTokens: res.usage?.completionTokens ?? 50,
                latencyMs: res.latencyMs ?? 0,
                success: res.success
            });
        }

        collector.stop();
        const durationMs = Date.now() - start;
        const memDeltaKb = (process.memoryUsage().heapUsed - memBefore) / 1024;

        const stats = collector.statsCollector.getRowStatistics();
        const ai = collector.aiAnalytics.getAISummary();

        console.log(`[stress] ${CALLS} AI calls | Duration: ${durationMs}ms | Heap delta: ${memDeltaKb.toFixed(0)}KB | Total tokens: ${ai.totalTokens}`);

        expect(durationMs).toBeLessThan(5000);
        expect(memDeltaKb).toBeLessThan(50 * 1024); // < 50MB
        expect(ai.callsCount).toBe(CALLS);
    }, 30000);

    it("handles retry engine under 500 rapid-fire executions without panicking", async () => {
        const engine = new RetryEngine();
        let failures = 0;

        const results = await Promise.all(
            Array.from({ length: 500 }, (_, i) =>
                engine
                    .execute(async () => i * 2, { maxAttempts: 1 })
                    .catch(() => {
                        failures++;
                        return -1;
                    })
            )
        );

        const successes = results.filter((r) => r !== -1).length;
        console.log(`[stress-retry] 500 concurrent executions: ${successes} succeeded, ${failures} failed`);

        expect(successes).toBe(500);
        expect(failures).toBe(0);
    }, 20000);

    it("withstands resilience under cascading provider failures followed by recovery", async () => {
        const provider = new MockAIProvider();
        const engine = new RetryEngine();
        let successCount = 0;

        // First 3 calls fail, then succeed
        let callNum = 0;
        const results = await Promise.allSettled(
            Array.from({ length: 10 }, () =>
                engine.execute(
                    async () => {
                        callNum++;
                        if (callNum <= 3) {
                            throw new Error("Provider temporarily unavailable");
                        }
                        const res = await provider.generate({ system: "sys", user: "resilience" });
                        successCount++;
                        return res;
                    },
                    { maxAttempts: 5, initialDelayMs: 5, delayStrategy: "constant", jitter: "none" }
                )
            )
        );

        const fulfilled = results.filter((r) => r.status === "fulfilled").length;
        console.log(`[stress-resilience] ${fulfilled}/10 calls fulfilled after provider recovery`);

        expect(fulfilled).toBeGreaterThan(5);
    }, 30000);
});
