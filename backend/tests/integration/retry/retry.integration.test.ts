import { describe, expect, it } from "vitest";
import { Container } from "../../../src/container/container";
import { EventBus } from "../../../src/core/events/EventBus";
import { RetryEngine } from "../../../src/core/retry/RetryEngine";

describe("RetryEngine Integration Tests", () => {
    it("auto-wires inside Dependency Injection Container successfully", () => {
        const container = new Container();
        
        container.registerSingleton("eventBus", EventBus);
        container.registerSingleton("config", {});
        container.registerSingleton("logger", { info: () => {}, warn: () => {}, error: () => {} });
        container.registerSingleton("retryEngine", RetryEngine);

        const engine = container.resolve<RetryEngine>("retryEngine");
        expect(engine).toBeInstanceOf(RetryEngine);
    });

    it("publishes retry and success events to the system EventBus", async () => {
        const eventBus = new EventBus();
        const engine = new RetryEngine(undefined, eventBus);

        const events: string[] = [];
        eventBus.subscribe("retry:started", () => { events.push("started"); });
        eventBus.subscribe("retry:attempt", () => { events.push("attempt"); });
        eventBus.subscribe("retry:succeeded", () => { events.push("succeeded"); });

        let attempts = 0;
        const res = await engine.execute(
            async () => {
                attempts++;
                if (attempts === 1) {
                    const err: any = new Error("Gateway timeout");
                    err.status = 504;
                    throw err;
                }
                return "payload";
            },
            { maxAttempts: 2, initialDelayMs: 1, delayStrategy: "constant", jitter: "none" }
        );

        expect(res).toBe("payload");
        expect(events).toContain("started");
        expect(events).toContain("attempt");
        expect(events).toContain("succeeded");
    });
});
