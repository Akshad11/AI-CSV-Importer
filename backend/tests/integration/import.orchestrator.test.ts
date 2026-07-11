import { describe, expect, it, beforeEach } from "vitest";
import path from "node:path";
import fs from "node:fs";
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

// Create custom Mock Provider for integration testing
class TestMockProvider extends MockAIProvider {
    public generateResult: any = {
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
        usage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30
        }
    };

    override async generate(): Promise<any> {
        return this.generateResult;
    }
}

describe("Import Orchestrator Integration Tests - Success Flows", () => {
    let container: Container;
    let mockProvider: TestMockProvider;
    let logger: ILogger;
    let eventBus: EventBus;
    let testCsvPath: string;
    let emptyCsvPath: string;

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

        // DI registrations
        container.registerSingleton("container", container);
        container.registerSingleton("config", { provider: "mock" });
        container.registerSingleton("MockProvider", mockProvider);
        container.registerSingleton("OpenAIProvider", mockProvider); // mapping OpenAI to mock in tests
        container.registerSingleton("GeminiProvider", mockProvider); // mapping Gemini to mock in tests
        container.registerSingleton("aiProviderResolver", AIProviderResolver);

        // Path setup
        testCsvPath = path.resolve("tests/fixtures/customers.csv");
        emptyCsvPath = path.resolve("tests/fixtures/empty.csv");

        // Write a temporary empty CSV file if it doesn't exist
        const fixturesDir = path.resolve("tests/fixtures");
        if (!fs.existsSync(fixturesDir)) {
            fs.mkdirSync(fixturesDir, { recursive: true });
        }
        if (!fs.existsSync(emptyCsvPath)) {
            fs.writeFileSync(emptyCsvPath, "Name,Email,Company\n");
        }
    });

    it("performs successful import with single batch", async () => {
        const context = new ImportContext({
            importId: "import-1",
            requestId: "request-1",
            provider: "mock",
            model: "mock-model",
            batchSize: 5,
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

        const result = await orchestrator.execute(context);

        expect(result.success).toBe(true);
        expect(result.importId).toBe("import-1");
        expect(result.status).toBe("completed");
        expect(result.crmRecords.length).toBe(1); // 1 record returned by mock AI per batch
        expect(result.processedRows).toBe(3); // 3 rows in customers.csv
        expect(result.successfulRows).toBe(1);
        expect(result.failedRows).toBe(2); // 3 total rows - 1 returned record

        // Verify stats
        expect(result.statistics.totalRows).toBe(3);
        expect(result.statistics.totalBatches).toBe(1);
        expect(result.statistics.completedBatches).toBe(1);
        expect(result.statistics.aiCalls).toBe(1);
        expect(result.statistics.totalTokens).toBe(30);
    });

    it("performs successful import with multiple batches", async () => {
        const context = new ImportContext({
            importId: "import-2",
            requestId: "request-2",
            provider: "mock",
            model: "mock-model",
            batchSize: 1, // multiple batches since totalRows = 3
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

        const result = await orchestrator.execute(context);

        expect(result.success).toBe(true);
        expect(result.status).toBe("completed");
        expect(result.crmRecords.length).toBe(3); // 3 batches, 1 record per batch = 3 records
        expect(result.processedRows).toBe(3);
        expect(result.statistics.totalBatches).toBe(3);
        expect(result.statistics.completedBatches).toBe(3);
        expect(result.statistics.aiCalls).toBe(3);
        expect(result.statistics.totalTokens).toBe(90); // 3 batches * 30 tokens = 90
    });

    it("handles empty CSV successfully with 0 batches", async () => {
        const context = new ImportContext({
            importId: "import-empty",
            requestId: "request-empty",
            provider: "mock",
            model: "mock-model",
            batchSize: 5,
            filePath: emptyCsvPath,
            originalFileName: "empty.csv",
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

        const result = await orchestrator.execute(context);

        expect(result.success).toBe(true);
        expect(result.status).toBe("completed");
        expect(result.crmRecords.length).toBe(0);
        expect(result.processedRows).toBe(0);
        expect(result.statistics.totalRows).toBe(0);
        expect(result.statistics.totalBatches).toBe(0);
        expect(result.statistics.completedBatches).toBe(0);
        expect(result.statistics.aiCalls).toBe(0);
    });

    it("supports resolution of different AI providers based on configuration", async () => {
        // Change default provider in config to gemini
        container.clear();
        container.registerSingleton("container", container);
        container.registerSingleton("config", { provider: "gemini" });
        container.registerSingleton("GeminiProvider", mockProvider);
        container.registerSingleton("aiProviderResolver", AIProviderResolver);

        const context = new ImportContext({
            importId: "import-provider-resolution",
            requestId: "request-provider-resolution",
            provider: "gemini", // use resolved provider
            model: "gemini-pro",
            batchSize: 5,
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

        const result = await orchestrator.execute(context);
        expect(result.success).toBe(true);
        expect(result.status).toBe("completed");
    });
});
