import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../../../src/core/events/EventBus";
import { ImportEventPayload } from "../../../src/core/events/events";
import { logger } from "../../../src/logger/logger";

describe("Event Bus", () => {
    it("notifies simple subscribers when publishing", async () => {
        const bus = new EventBus();
        let payloadReceived: ImportEventPayload | null = null;

        bus.subscribe("import:started", (payload) => {
            payloadReceived = payload;
        });

        const samplePayload: ImportEventPayload = {
            importId: "imp-1",
            stage: "init",
            timestamp: new Date(),
        };

        await bus.publish("import:started", samplePayload);

        expect(payloadReceived).toBe(samplePayload);
    });

    it("notifies multiple subscribers in parallel", async () => {
        const bus = new EventBus();
        let callCount = 0;

        bus.subscribe("import:completed", () => {
            callCount++;
        });
        bus.subscribe("import:completed", () => {
            callCount++;
        });

        await bus.publish("import:completed", {
            importId: "imp-1",
            stage: "complete",
            timestamp: new Date(),
        });

        expect(callCount).toBe(2);
    });

    it("supports once listeners which execute exactly once", async () => {
        const bus = new EventBus();
        let callCount = 0;

        bus.once("import:started", () => {
            callCount++;
        });

        const samplePayload = {
            importId: "imp-1",
            stage: "init",
            timestamp: new Date(),
        };

        await bus.publish("import:started", samplePayload);
        await bus.publish("import:started", samplePayload);

        expect(callCount).toBe(1);
    });

    it("allows unsubscribing", async () => {
        const bus = new EventBus();
        let callCount = 0;

        const unsubscribe = bus.subscribe("import:started", () => {
            callCount++;
        });

        const samplePayload = {
            importId: "imp-1",
            stage: "init",
            timestamp: new Date(),
        };

        await bus.publish("import:started", samplePayload);
        unsubscribe();
        await bus.publish("import:started", samplePayload);

        expect(callCount).toBe(1);
    });

    it("isolates handler errors", async () => {
        const bus = new EventBus();
        let secondCalled = false;

        bus.subscribe("import:started", () => {
            throw new Error("Handler failed");
        });

        bus.subscribe("import:started", () => {
            secondCalled = true;
        });

        // Mock logger.error to avoid cluttering test outputs
        const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

        await expect(
            bus.publish("import:started", {
                importId: "imp-1",
                stage: "init",
                timestamp: new Date(),
            })
        ).resolves.not.toThrow();

        expect(secondCalled).toBe(true);
        expect(loggerSpy).toHaveBeenCalled();
        loggerSpy.mockRestore();
    });
});
