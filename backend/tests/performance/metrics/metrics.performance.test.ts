import { describe, expect, it } from "vitest";
import { MetricsCollector } from "../../../src/core/metrics/MetricsCollector";
import { ResourceMonitor } from "../../../src/core/parallel/ResourceMonitor";

describe("MetricsCollector Performance Tests", () => {
    it("handles 10,000 record loops while maintaining constant memory bounds", () => {
        const collector = new MetricsCollector();
        const monitor = new ResourceMonitor();

        const memStart = monitor.getMemoryUsageInfo();
        collector.start();

        for (let i = 0; i < 10000; i++) {
            collector.updateStats((s) => {
                s.incrementProcessed();
                s.incrementSuccessful();
            });

            if (i % 10 === 0) {
                collector.recordCall({
                    provider: "openai",
                    model: "gemini-1.5-flash",
                    promptTokens: 100,
                    completionTokens: 50,
                    latencyMs: 15,
                    success: true
                });
            }
        }

        collector.stop();
        const memEnd = monitor.getMemoryUsageInfo();

        expect(collector.statsCollector.getRowStatistics().processed).toBe(10000);
        expect(memEnd.heapUsed).toBeLessThan(memStart.heapTotal);
    });
});
