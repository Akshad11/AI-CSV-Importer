import { describe, expect, it } from "vitest";
import { Container } from "../../../src/container/container";
import { EventBus } from "../../../src/core/events/EventBus";
import { MetricsCollector } from "../../../src/core/metrics/MetricsCollector";

describe("MetricsCollector Integration Tests", () => {
    it("auto-wires inside the dependency injection container seamlessly", () => {
        const container = new Container();

        container.registerSingleton("eventBus", EventBus);
        container.registerSingleton("metricsCollector", MetricsCollector);

        const collector = container.resolve<MetricsCollector>("metricsCollector");
        expect(collector).toBeInstanceOf(MetricsCollector);
    });

    it("publishes warning alerts across EventBus when budget thresholds are breached", () => {
        const eventBus = new EventBus();
        const collector = new MetricsCollector(eventBus, "stress-test");

        const warnings: string[] = [];
        eventBus.subscribe("metrics:cost_threshold:exceeded", (payload) => {
            warnings.push(payload.warning!);
        });

        collector.start();

        // 1M prompt + 200k completion tokens triggers the $5 threshold
        collector.recordCall({
            provider: "openai",
            model: "gpt-4o",
            promptTokens: 1000000,
            completionTokens: 200000,
            latencyMs: 12000,
            success: true
        });

        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings[0]).toContain("Total AI cost exceeded budget threshold");
    });
});
