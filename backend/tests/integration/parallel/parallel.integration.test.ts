import { describe, expect, it } from "vitest";
import { Container } from "../../../src/container/container";
import { EventBus } from "../../../src/core/events/EventBus";
import { RetryEngine } from "../../../src/core/retry/RetryEngine";
import { ParallelExecutor } from "../../../src/core/parallel/ParallelExecutor";

describe("ParallelExecutor Integration Tests", () => {
    it("auto-wires within the dependency injection container seamlessly", () => {
        const container = new Container();

        container.registerSingleton("eventBus", EventBus);
        container.registerSingleton("config", {});
        container.registerSingleton("logger", { info: () => {}, warn: () => {}, error: () => {} });
        container.registerSingleton("retryEngine", RetryEngine);
        container.registerSingleton("parallelExecutor", ParallelExecutor);

        const executor = container.resolve<ParallelExecutor>("parallelExecutor");
        expect(executor).toBeInstanceOf(ParallelExecutor);
    });

    it("triggers and propagates worker and parallel events across EventBus", async () => {
        const eventBus = new EventBus();
        const retryEngine = new RetryEngine(undefined, eventBus);
        const executor = new ParallelExecutor(retryEngine, eventBus);

        const events: string[] = [];
        eventBus.subscribe("worker:started", () => { events.push("worker:started"); });
        eventBus.subscribe("parallel:batch:queued", () => { events.push("parallel:batch:queued"); });
        eventBus.subscribe("parallel:batch:dequeued", () => { events.push("parallel:batch:dequeued"); });
        eventBus.subscribe("parallel:batch:started", () => { events.push("parallel:batch:started"); });
        eventBus.subscribe("parallel:batch:completed", () => { events.push("parallel:batch:completed"); });
        eventBus.subscribe("parallel:started", () => { events.push("parallel:started"); });
        eventBus.subscribe("parallel:completed", () => { events.push("parallel:completed"); });

        async function* makeStream() {
            yield "batch1";
        }

        const result = await executor.execute({
            source: makeStream(),
            worker: async (data: string) => data,
            concurrency: 1
        });

        expect(result.success).toBe(true);
        expect(events).toContain("worker:started");
        expect(events).toContain("parallel:batch:queued");
        expect(events).toContain("parallel:batch:dequeued");
        expect(events).toContain("parallel:batch:started");
        expect(events).toContain("parallel:batch:completed");
        expect(events).toContain("parallel:started");
        expect(events).toContain("parallel:completed");
    });
});
