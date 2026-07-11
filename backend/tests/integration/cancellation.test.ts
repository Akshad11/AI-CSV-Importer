import { describe, expect, it, beforeEach } from "vitest";
import path from "node:path";
import { Container } from "../../src/container/container";
import { ImportContext } from "../../src/core/pipeline/ImportContext";
import { ImportOrchestrator } from "../../src/orchestrator/ImportOrchestrator";
import { CsvParserService } from "../../src/services/csv/csvParser.service";
import { BatchService } from "../../src/services/batch/batch.service";
import { PromptBuilderService } from "../../src/services/ai/promptBuilder.service";
import { ResponseValidatorService } from "../../src/services/validation/responseValidator.service";
import { EventBus } from "../../src/core/events/EventBus";
import { AIProviderResolver } from "../../src/services/ai/AIProviderResolver";
import { CancellationToken } from "../../src/core/cancellation/CancellationToken";
import { CancellationError } from "../../src/core/cancellation/CancellationError";
import { MockAIProvider } from "../mocks/MockAIProvider";
import { ILogger } from "../../src/core/interfaces/ILogger";

class TestMockProvider extends MockAIProvider {
    override async generate(): Promise<any> {
        return {
            success: true,
            provider: "mock",
            model: "mock-model",
            data: JSON.stringify([
                {
                    created_at: "2026-05-13 14:20:48",
                    name: "John Doe",
                    email: "john.doe@example.com",
                    company: "GrowEasy",
                    mobile_without_country_code: "9876543210",
                    crm_status: "GOOD_LEAD_FOLLOW_UP"
                }
            ])
        };
    }
}

describe("Import Orchestrator Integration Tests - Cancellation", () => {
    let container: Container;
    let mockProvider: TestMockProvider;
    let logger: ILogger;
    let eventBus: EventBus;
    let testCsvPath: string;

    beforeEach(() => {
        container = new Container();
        mockProvider = new TestMockProvider();
        eventBus = new EventBus();
        
        logger = {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {}
        };

        container.registerSingleton("container", container);
        container.registerSingleton("config", { provider: "mock" });
        container.registerSingleton("MockProvider", mockProvider);
        container.registerSingleton("aiProviderResolver", AIProviderResolver);

        testCsvPath = path.resolve("tests/fixtures/customers.csv");
    });

    it("stops immediately and emits cancelled event when cancellation token is cancelled before execution", async () => {
        const token = new CancellationToken();
        token.cancel("User cancellation");

        const context = new ImportContext({
            importId: "import-cancelled-1",
            requestId: "request-cancelled-1",
            provider: "mock",
            model: "mock-model",
            batchSize: 1,
            filePath: testCsvPath,
            originalFileName: "customers.csv",
            cancellationToken: token,
            eventBus,
            logger
        });

        const orchestrator = new ImportOrchestrator({
            csvParser: new CsvParserService(),
            batchService: new BatchService(),
            promptBuilder: new PromptBuilderService(),
            aiProviderResolver: container.resolve<AIProviderResolver>("aiProviderResolver"),
            validator: new ResponseValidatorService(),
            eventBus,
            logger
        });

        let cancelledEventEmitted = false;
        let eventReason = "";

        eventBus.subscribe("import:cancelled", (payload) => {
            cancelledEventEmitted = true;
            eventReason = payload.reason;
        });

        await expect(orchestrator.execute(context)).rejects.toThrow(CancellationError);
        expect(cancelledEventEmitted).toBe(true);
        expect(eventReason).toBe("User cancellation");
    });

    it("stops immediately during batch iteration if cancellation token is triggered mid-way", async () => {
        const token = new CancellationToken();
        const eventBusWithCancellation = new EventBus();

        const context = new ImportContext({
            importId: "import-cancelled-2",
            requestId: "request-cancelled-2",
            provider: "mock",
            model: "mock-model",
            batchSize: 1, // 3 batches total
            filePath: testCsvPath,
            originalFileName: "customers.csv",
            cancellationToken: token,
            eventBus: eventBusWithCancellation,
            logger
        });

        const orchestrator = new ImportOrchestrator({
            csvParser: new CsvParserService(),
            batchService: new BatchService(),
            promptBuilder: new PromptBuilderService(),
            aiProviderResolver: container.resolve<AIProviderResolver>("aiProviderResolver"),
            validator: new ResponseValidatorService(),
            eventBus: eventBusWithCancellation,
            logger
        });

        let cancelledEventEmitted = false;
        eventBusWithCancellation.subscribe("import:cancelled", () => {
            cancelledEventEmitted = true;
        });

        // Cancel the token when the first batch completes
        eventBusWithCancellation.subscribe("batch:completed", (payload) => {
            if (payload.batchNumber === 1) {
                token.cancel("Cancelled after first batch");
            }
        });

        await expect(orchestrator.execute(context)).rejects.toThrow(CancellationError);
        expect(cancelledEventEmitted).toBe(true);
        expect((context.statistics as any).completedBatches).toBe(1); // Only 1 batch should complete
    });
});
