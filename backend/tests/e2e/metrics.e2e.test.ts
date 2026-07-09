import { describe, expect, it } from "vitest";
import { MetricsCollector } from "../../src/core/metrics/MetricsCollector";
import { EventBus } from "../../src/core/events/EventBus";

describe("Metrics E2E Test", () => {
    it("tracks executions and raises cost exceed warning flags", () => {
        const eventBus = new EventBus();
        const collector = new MetricsCollector(eventBus, "metrics-e2e");

        let costThresholdExceeded = false;
        eventBus.subscribe("metrics:cost_threshold:exceeded", () => {
            costThresholdExceeded = true;
        });

        collector.start();

        collector.recordCall({
            provider: "openai",
            model: "gpt-4o",
            promptTokens: 1200000,
            completionTokens: 100000,
            latencyMs: 1500,
            success: true
        });

        expect(costThresholdExceeded).toBe(true);
    });
});
