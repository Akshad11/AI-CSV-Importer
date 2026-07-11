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
import {
    AIProviderError,
    ValidationError,
    JsonParsingError
} from "../../src/orchestrator/Orchestrator.errors";

class FailingProvider extends MockAIProvider {
    override async generate(): Promise<any> {
        return {
            success: false,
            provider: "mock",
            model: "mock-model",
            data: "API Key expired"
        };
    }
}

class InvalidJsonProvider extends MockAIProvider {
    override async generate(): Promise<any> {
        return {
            success: true,
            provider: "mock",
            model: "mock-model",
            data: "This is not valid JSON array [invalid"
        };
    }
}

class ZodValidationErrorProvider extends MockAIProvider {
    override async generate(): Promise<any> {
        return {
            success: true,
            provider: "mock",
            model: "mock-model",
            data: JSON.stringify([
                {
                    name: 123, // should be string or null
                    crm_status: "INVALID_STATUS" // should be valid enum or null
                }
            ])
        };
    }
}

describe("Import Orchestrator Integration Tests - Errors and Dependency Injection", () => {
    let container: Container;
    let logger: ILogger;
    let eventBus: EventBus;
    let testCsvPath: string;

    beforeEach(() => {
        container = new Container();
        eventBus = new EventBus();
        
        logger = {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {}
        };

        testCsvPath = path.resolve("tests/fixtures/customers.csv");
    });

    it("propagates AIProviderError when AI provider execution fails", async () => {
        container.registerSingleton("container", container);
        container.registerSingleton("config", { provider: "mock" });
        container.registerSingleton("MockProvider", new FailingProvider());
        container.registerSingleton("aiProviderResolver", AIProviderResolver);

        const context = new ImportContext({
            importId: "import-fail-ai",
            requestId: "request-fail-ai",
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

        let importFailedEmitted = false;
        let emittedError: Error | undefined;

        eventBus.subscribe("import:failed", (payload) => {
            importFailedEmitted = true;
            emittedError = payload.error;
        });

        await expect(orchestrator.execute(context)).rejects.toThrow(AIProviderError);
        expect(importFailedEmitted).toBe(true);
        expect(emittedError).toBeInstanceOf(AIProviderError);
        expect(emittedError?.message).toContain("API Key expired");
    });

    it("propagates JsonParsingError when AI response is not a valid JSON array", async () => {
        container.registerSingleton("container", container);
        container.registerSingleton("config", { provider: "mock" });
        container.registerSingleton("MockProvider", new InvalidJsonProvider());
        container.registerSingleton("aiProviderResolver", AIProviderResolver);

        const context = new ImportContext({
            importId: "import-fail-json",
            requestId: "request-fail-json",
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

        let importFailedEmitted = false;
        let emittedError: Error | undefined;

        eventBus.subscribe("import:failed", (payload) => {
            importFailedEmitted = true;
            emittedError = payload.error;
        });

        await expect(orchestrator.execute(context)).rejects.toThrow(JsonParsingError);
        expect(importFailedEmitted).toBe(true);
        expect(emittedError).toBeInstanceOf(JsonParsingError);
    });

    it("propagates ValidationError when AI response fails Zod schema verification", async () => {
        container.registerSingleton("container", container);
        container.registerSingleton("config", { provider: "mock" });
        container.registerSingleton("MockProvider", new ZodValidationErrorProvider());
        container.registerSingleton("aiProviderResolver", AIProviderResolver);

        const context = new ImportContext({
            importId: "import-fail-zod",
            requestId: "request-fail-zod",
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

        let importFailedEmitted = false;
        let emittedError: Error | undefined;

        eventBus.subscribe("import:failed", (payload) => {
            importFailedEmitted = true;
            emittedError = payload.error;
        });

        await expect(orchestrator.execute(context)).rejects.toThrow(ValidationError);
        expect(importFailedEmitted).toBe(true);
        expect(emittedError).toBeInstanceOf(ValidationError);
    });

    it("supports dependency injection auto-wiring via the DI Container", () => {
        // Register all constructor arguments under the expected tokens
        container.registerSingleton("container", container);
        container.registerSingleton("config", { provider: "mock" });
        container.registerSingleton("MockProvider", new FailingProvider());
        
        container.registerSingleton("csvParser", CsvParserService);
        container.registerSingleton("batchService", BatchService);
        container.registerSingleton("promptBuilder", PromptBuilderService);
        container.registerSingleton("aiProviderResolver", AIProviderResolver);
        container.registerSingleton("validator", ResponseValidatorService);
        container.registerSingleton("eventBus", () => eventBus);
        container.registerSingleton("logger", () => logger);

        // Register the ImportOrchestrator class
        container.registerSingleton("importOrchestrator", ImportOrchestrator);

        // Resolve from container
        const orchestrator = container.resolve<ImportOrchestrator>("importOrchestrator");

        expect(orchestrator).toBeInstanceOf(ImportOrchestrator);
        expect((orchestrator as any).csvParser).toBeInstanceOf(CsvParserService);
        expect((orchestrator as any).batchService).toBeInstanceOf(BatchService);
        expect((orchestrator as any).promptBuilder).toBeInstanceOf(PromptBuilderService);
        expect((orchestrator as any).validator).toBeInstanceOf(ResponseValidatorService);
        expect((orchestrator as any).eventBus).toBe(eventBus);
        expect((orchestrator as any).logger).toBe(logger);
    });
});
