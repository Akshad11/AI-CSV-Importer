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
            ]),
            usage: { totalTokens: 10 }
        };
    }
}

describe("Import Orchestrator Integration Tests - Progress Events", () => {
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

    it("emits the full sequence of progress events during execution", async () => {
        const context = new ImportContext({
            importId: "import-progress-1",
            requestId: "request-progress-1",
            provider: "mock",
            model: "mock-model",
            batchSize: 1, // multiple batches
            filePath: testCsvPath,
            originalFileName: "customers.csv",
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

        const emittedEvents: string[] = [];
        
        eventBus.subscribe("import:started", () => { emittedEvents.push("import:started"); });
        eventBus.subscribe("parsing:started", () => { emittedEvents.push("parsing:started"); });
        eventBus.subscribe("parsing:completed", () => { emittedEvents.push("parsing:completed"); });
        eventBus.subscribe("batch:created", () => { emittedEvents.push("batch:created"); });
        eventBus.subscribe("batch:started", () => { emittedEvents.push("batch:started"); });
        eventBus.subscribe("batch:completed", () => { emittedEvents.push("batch:completed"); });
        eventBus.subscribe("ai:started", () => { emittedEvents.push("ai:started"); });
        eventBus.subscribe("ai:completed", () => { emittedEvents.push("ai:completed"); });
        eventBus.subscribe("validation:started", () => { emittedEvents.push("validation:started"); });
        eventBus.subscribe("validation:completed", () => { emittedEvents.push("validation:completed"); });
        eventBus.subscribe("import:completed", () => { emittedEvents.push("import:completed"); });
        eventBus.subscribe("progress:changed", () => { emittedEvents.push("progress:changed"); });

        await orchestrator.execute(context);

        // Check for presence of all event types in sequence
        expect(emittedEvents).toContain("import:started");
        expect(emittedEvents).toContain("parsing:started");
        expect(emittedEvents).toContain("parsing:completed");
        expect(emittedEvents).toContain("batch:created");
        expect(emittedEvents).toContain("batch:started");
        expect(emittedEvents).toContain("batch:completed");
        expect(emittedEvents).toContain("ai:started");
        expect(emittedEvents).toContain("ai:completed");
        expect(emittedEvents).toContain("validation:started");
        expect(emittedEvents).toContain("validation:completed");
        expect(emittedEvents).toContain("import:completed");
        expect(emittedEvents).toContain("progress:changed");

        // Verify the chronological ordering of key setup events
        const importStartedIdx = emittedEvents.indexOf("import:started");
        const parsingStartedIdx = emittedEvents.indexOf("parsing:started");
        const parsingCompletedIdx = emittedEvents.indexOf("parsing:completed");
        const importCompletedIdx = emittedEvents.indexOf("import:completed");

        expect(importStartedIdx).toBeLessThan(parsingStartedIdx);
        expect(parsingStartedIdx).toBeLessThan(parsingCompletedIdx);
        expect(parsingCompletedIdx).toBeLessThan(importCompletedIdx);
    });
});
