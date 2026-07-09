import { describe, expect, it } from "vitest";
import { MetricsCollector } from "../../../src/core/metrics/MetricsCollector";
import { CostCalculator } from "../../../src/core/metrics/CostCalculator";
import { ThroughputCalculator } from "../../../src/core/metrics/ThroughputCalculator";

describe("MetricsCollector & Calculators Unit Tests", () => {
    it("computes AI cost pricing models accurately", () => {
        const calculator = new CostCalculator();

        // 1000 prompt tokens and 2000 completion tokens on gpt-4o
        const costGpt4 = calculator.calculateCost("gpt-4o", 1000, 2000);
        expect(costGpt4).toBe(0.035); // (1 * 0.005) + (2 * 0.015) = 0.035

        // gemini-1.5-pro cost check
        const costGemini = calculator.calculateCost("gemini-1.5-pro", 1000, 1000);
        expect(costGemini).toBe(0.005); // (1 * 0.00125) + (1 * 0.00375) = 0.005
    });

    it("evaluates latency percentiles and throughput speeds", () => {
        const throughput = new ThroughputCalculator();

        const speed = throughput.calculateThroughput(100, 10, 5000, 2000);
        expect(speed.rowsPerSecond).toBe(50);
        expect(speed.batchesPerSecond).toBe(5);
        expect(speed.tokensPerSecond).toBe(2500);

        const percentiles = throughput.calculatePercentiles([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
        expect(percentiles.p50).toBe(60);
        expect(percentiles.p90).toBe(100);
    });

    it("gathers errors and profiles them by classification", () => {
        const collector = new MetricsCollector();
        collector.start();

        collector.recordError(new Error("validation schema mismatch"), "Ingestion", 1);
        collector.recordError(new Error("network socket timeout"), "Worker Execution", 2);

        const summary = collector.errorAnalytics.getErrorSummary();
        expect(summary.validationErrors).toBe(1);
        expect(summary.timeouts).toBe(1);
        expect(summary.profiles.length).toBe(2);
    });
});
