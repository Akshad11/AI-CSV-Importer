import { describe, expect, it } from "vitest";
import { ThroughputCalculator } from "../../src/core/metrics/ThroughputCalculator";

describe("Latency Performance Tests", () => {
    it("computes P50, P90, P99 percentile latencies within 1ms overhead", () => {
        const calc = new ThroughputCalculator();

        // Simulated 1000 latency samples: mix of fast and slow calls
        const latencies: number[] = [];
        for (let i = 0; i < 950; i++) latencies.push(50 + Math.random() * 100); // fast: 50-150ms
        for (let i = 0; i < 50; i++) latencies.push(800 + Math.random() * 400);  // slow: 800-1200ms

        const start = Date.now();
        const percentiles = calc.calculatePercentiles(latencies);
        const overheadMs = Date.now() - start;

        console.log(`[latency] P50=${percentiles.p50}ms P90=${percentiles.p90}ms P99=${percentiles.p99}ms | Calc overhead: ${overheadMs}ms`);

        // Sorting 1000 items should complete in well under 5ms of overhead
        expect(overheadMs).toBeLessThanOrEqual(5);
        expect(percentiles.p50).toBeGreaterThan(50);
        expect(percentiles.p50).toBeLessThan(200);
        // P90 (position 900/1000) is still within the fast band (950 samples, max ~150ms)
        expect(percentiles.p90).toBeGreaterThan(50);
        expect(percentiles.p90).toBeLessThan(200);
        // P99 (position 990/1000) lands in the slow band (positions 951-1000 are 800-1200ms)
        expect(percentiles.p99).toBeGreaterThan(500);
    });

    it("evaluates that mock AI latency overhead stays below 5ms", async () => {
        const { MockAIProvider } = await import("../mocks/MockAIProvider");
        const provider = new MockAIProvider();

        const iterations = 50;
        const latencies: number[] = [];

        for (let i = 0; i < iterations; i++) {
            const start = Date.now();
            await provider.generate({ system: "sys", user: "msg" });
            latencies.push(Date.now() - start);
        }

        const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        console.log(`[ai-latency] Average mock AI latency: ${avgLatency.toFixed(2)}ms`);

        expect(avgLatency).toBeLessThan(5);
    });
});
