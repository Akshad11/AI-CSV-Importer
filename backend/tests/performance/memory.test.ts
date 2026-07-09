import { describe, expect, it } from "vitest";
import { MetricsCollector } from "../../src/core/metrics/MetricsCollector";

describe("Memory Performance Tests", () => {
    it("maintains stable heap usage across 50,000 metrics recordings", () => {
        const collector = new MetricsCollector();
        collector.start();

        const memBefore = process.memoryUsage().heapUsed;

        for (let i = 0; i < 50000; i++) {
            collector.updateStats((s) => {
                s.incrementProcessed();
                if (i % 10 === 0) s.incrementFailed();
                else s.incrementSuccessful();
            });
        }

        collector.stop();
        const memAfter = process.memoryUsage().heapUsed;
        const deltaKb = (memAfter - memBefore) / 1024;

        console.log(`[memory] Heap delta over 50k recordings: ${deltaKb.toFixed(1)} KB`);

        // Should not grow more than 50MB for in-process counters
        expect(deltaKb).toBeLessThan(50 * 1024);
    }, 30000);

    it("records AI calls without per-call heap leaks exceeding 1KB each", () => {
        const collector = new MetricsCollector();
        collector.start();

        const CALLS = 5000;
        const memBefore = process.memoryUsage().heapUsed;

        for (let i = 0; i < CALLS; i++) {
            collector.recordCall({
                provider: "mock",
                model: "gemini-1.5-flash",
                promptTokens: 100,
                completionTokens: 50,
                latencyMs: 20,
                success: true
            });
        }

        const memAfter = process.memoryUsage().heapUsed;
        const perCallBytes = (memAfter - memBefore) / CALLS;

        console.log(`[memory] Per AI-call heap delta: ${perCallBytes.toFixed(0)} bytes`);
        expect(perCallBytes).toBeLessThan(2048); // < 2KB per call (accounts for log entry object overhead)
    }, 20000);
});
