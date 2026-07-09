import { describe, expect, it, vi } from "vitest";
import { ImportContext } from "../../../src/core/pipeline/ImportContext";
import { CancellationToken } from "../../../src/core/cancellation/CancellationToken";
import { EventBus } from "../../../src/core/events/EventBus";
import { ILogger } from "../../../src/core/interfaces/ILogger";
import { ProgressEventPayload } from "../../../src/core/events/events";

describe("Import Context", () => {
    const mockLogger: ILogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };

    it("initializes with correct properties and default dependencies", () => {
        const context = new ImportContext({
            importId: "imp-123",
            requestId: "req-456",
            provider: "mock",
            model: "mock-model",
            batchSize: 10,
            filePath: "/tmp/test.csv",
            originalFileName: "test.csv",
            logger: mockLogger,
        });

        expect(context.importId).toBe("imp-123");
        expect(context.requestId).toBe("req-456");
        expect(context.provider).toBe("mock");
        expect(context.model).toBe("mock-model");
        expect(context.batchSize).toBe(10);
        expect(context.filePath).toBe("/tmp/test.csv");
        expect(context.originalFileName).toBe("test.csv");
        expect(context.startedAt).toBeInstanceOf(Date);
        expect(context.cancellationToken).toBeInstanceOf(CancellationToken);
        expect(context.eventBus).toBeInstanceOf(EventBus);
        expect(context.progress.stage).toBe("initialization");
        expect(context.progress.percentage).toBe(0);
        expect(context.statistics.totalRows).toBe(0);
        expect(context.statistics.processedRows).toBe(0);
        expect(context.statistics.successfulRows).toBe(0);
        expect(context.statistics.failedRows).toBe(0);
    });

    it("allows updating progress and emits progress:changed event", async () => {
        const bus = new EventBus();
        const context = new ImportContext({
            importId: "imp-123",
            requestId: "req-456",
            provider: "mock",
            model: "mock-model",
            batchSize: 10,
            filePath: "/tmp/test.csv",
            originalFileName: "test.csv",
            logger: mockLogger,
            eventBus: bus,
        });

        let eventPayload: ProgressEventPayload | null = null;
        bus.subscribe("progress:changed", (payload) => {
            eventPayload = payload;
        });

        await context.updateProgress({
            stage: "parsing",
            percentage: 50,
            processedRows: 100,
            totalRows: 200,
            message: "Parsing half done",
        });

        expect(context.progress.stage).toBe("parsing");
        expect(context.progress.percentage).toBe(50);
        expect(context.progress.processedRows).toBe(100);
        expect(context.progress.totalRows).toBe(200);
        expect(context.progress.message).toBe("Parsing half done");

        expect(context.statistics.processedRows).toBe(100);
        expect(context.statistics.totalRows).toBe(200);

        expect(eventPayload).not.toBeNull();
        expect(eventPayload!.importId).toBe("imp-123");
        expect(eventPayload!.progress).toBe(50);
        expect(eventPayload!.stage).toBe("parsing");
    });

    it("correctly tracks success and failed rows incrementation", () => {
        const context = new ImportContext({
            importId: "imp-123",
            requestId: "req-456",
            provider: "mock",
            model: "mock-model",
            batchSize: 10,
            filePath: "/tmp/test.csv",
            originalFileName: "test.csv",
            logger: mockLogger,
        });

        context.incrementSuccessRows(5);
        context.incrementFailedRows(2);

        expect(context.statistics.successfulRows).toBe(5);
        expect(context.statistics.failedRows).toBe(2);
    });
});
