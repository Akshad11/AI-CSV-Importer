import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../../../src/core/events/EventBus";
import { ProgressEmitter } from "../../../src/core/events/ProgressEmitter";
import { ProgressEventPayload, RowParsedPayload } from "../../../src/core/events/events";

describe("Progress Emitter", () => {
    it("delegates progress events correctly to the event bus", async () => {
        const bus = new EventBus();
        const emitter = new ProgressEmitter(bus, "test-import-id");

        let progressReceived: ProgressEventPayload | null = null;
        bus.subscribe("progress:changed", (payload) => {
            progressReceived = payload;
        });

        await emitter.emitProgressChanged(45, "parsing");

        expect(progressReceived).not.null;
        expect(progressReceived!.importId).toBe("test-import-id");
        expect(progressReceived!.progress).toBe(45);
        expect(progressReceived!.stage).toBe("parsing");
        expect(progressReceived!.timestamp).toBeInstanceOf(Date);
    });

    it("delegates row parsed events correctly", async () => {
        const bus = new EventBus();
        const emitter = new ProgressEmitter(bus, "test-import-id");

        let rowPayload: RowParsedPayload | null = null;
        bus.subscribe("row:parsed", (payload) => {
            rowPayload = payload;
        });

        const rawRow = { Name: "Alice", Email: "alice@example.com" };
        await emitter.emitRowParsed(10, rawRow);

        expect(rowPayload).not.null;
        expect(rowPayload!.importId).toBe("test-import-id");
        expect(rowPayload!.rowNumber).toBe(10);
        expect(rowPayload!.rawRow).toEqual(rawRow);
    });

    it("delegates failed and completed events", async () => {
        const bus = new EventBus();
        const emitter = new ProgressEmitter(bus, "test-import-id");

        let failedEventCalled = false;
        let completedEventCalled = false;

        bus.subscribe("import:failed", () => {
            failedEventCalled = true;
        });
        bus.subscribe("import:completed", () => {
            completedEventCalled = true;
        });

        await emitter.emitFailed(new Error("Database offline"));
        await emitter.emitCompleted();

        expect(failedEventCalled).toBe(true);
        expect(completedEventCalled).toBe(true);
    });
});
