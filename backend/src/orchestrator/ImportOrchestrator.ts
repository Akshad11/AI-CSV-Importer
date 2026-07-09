import { ImportContext } from "../core/pipeline/ImportContext";
import { PipelineStage } from "../core/pipeline/PipelineStage";
import { CsvParserService } from "../services/csv/csvParser.service";
import { BatchService } from "../services/batch/batch.service";
import { PromptBuilderService } from "../services/ai/promptBuilder.service";
import { IAIProviderResolver } from "../core/interfaces/IAIProviderResolver";
import { ResponseValidatorService } from "../services/validation/responseValidator.service";
import { EventBus } from "../core/events/EventBus";
import { ILogger } from "../core/interfaces/ILogger";
import { CancellationError } from "../core/cancellation/CancellationError";
import { ImportResult, Pipeline } from "./Orchestrator.types";
import { PipelineBuilder } from "./PipelineBuilder";
import {
    ParserStage,
    BatchStage,
    PromptStage,
    AIStage,
    ValidatorStage,
    MapperStage
} from "./PipelineExecutor";
import {
    OrchestratorError,
    ValidationError,
    UnexpectedOrchestratorError
} from "./Orchestrator.errors";

export interface ImportOrchestratorDependencies {
    csvParser: CsvParserService;
    batchService: BatchService;
    promptBuilder: PromptBuilderService;
    aiProviderResolver?: IAIProviderResolver;
    aiProvider?: any; // Compatibility fallback for direct mock injection
    validator: ResponseValidatorService;
    eventBus: EventBus;
    logger: ILogger;
    pipeline?: Pipeline;
}

export class ImportOrchestrator extends PipelineStage {
    public readonly name = "import-orchestrator";

    public static inject = [
        "csvParser",
        "batchService",
        "promptBuilder",
        "aiProviderResolver",
        "validator",
        "eventBus",
        "logger"
    ];

    private readonly csvParser: CsvParserService;
    private readonly batchService: BatchService;
    private readonly promptBuilder: PromptBuilderService;
    private readonly aiProviderResolver: IAIProviderResolver;
    private readonly validator: ResponseValidatorService;
    private readonly eventBus: EventBus;
    private readonly logger: ILogger;
    private readonly pipeline: Pipeline;

    constructor(
        depsOrCsvParser: ImportOrchestratorDependencies | CsvParserService,
        batchService?: BatchService,
        promptBuilder?: PromptBuilderService,
        aiProviderResolver?: IAIProviderResolver,
        validator?: ResponseValidatorService,
        eventBus?: EventBus,
        logger?: ILogger
    ) {
        super();

        let deps: ImportOrchestratorDependencies;

        // Check if the first argument is the dependency options object
        if (
            depsOrCsvParser &&
            !(depsOrCsvParser instanceof CsvParserService) &&
            ("csvParser" in depsOrCsvParser || "eventBus" in depsOrCsvParser)
        ) {
            deps = depsOrCsvParser as ImportOrchestratorDependencies;
        } else {
            // Otherwise, it was called via positional arguments (e.g. by DI container)
            deps = {
                csvParser: depsOrCsvParser as CsvParserService,
                batchService: batchService!,
                promptBuilder: promptBuilder!,
                aiProviderResolver: aiProviderResolver,
                validator: validator!,
                eventBus: eventBus!,
                logger: logger!
            };
        }

        this.csvParser = deps.csvParser;
        this.batchService = deps.batchService;
        this.promptBuilder = deps.promptBuilder;

        // Resolve either aiProviderResolver or compatibility aiProvider (as a resolver or provider)
        const resolver = deps.aiProviderResolver || deps.aiProvider;
        if (!resolver) {
            throw new ValidationError("AI Provider Resolver is required");
        }

        // If the resolved object does not have a "resolve" method, wrap it in a mock resolver for compatibility
        if (typeof (resolver as any).resolve === "function") {
            this.aiProviderResolver = resolver as IAIProviderResolver;
        } else {
            this.aiProviderResolver = {
                resolve: () => resolver
            };
        }

        this.validator = deps.validator;
        this.eventBus = deps.eventBus;
        this.logger = deps.logger;

        this.pipeline = deps.pipeline || new PipelineBuilder()
            .addStage(new ParserStage(this.csvParser))
            .addStage(new BatchStage(this.batchService))
            .addStage(new PromptStage(this.promptBuilder))
            .addStage(new AIStage(this.aiProviderResolver))
            .addStage(new ValidatorStage(this.validator))
            .addStage(new MapperStage())
            .build();
    }

    public async execute(context: ImportContext): Promise<ImportResult> {
        const stats = context.statistics as any;
        stats.skippedRows = 0;
        stats.totalBatches = 0;
        stats.completedBatches = 0;
        stats.failedBatches = 0;
        stats.aiCalls = 0;
        stats.totalTokens = 0;

        const startTime = Date.now();

        try {
            // Validate context
            this.validateContext(context);

            this.logger.info("Import Orchestrator execution started", {
                requestId: context.requestId,
                importId: context.importId,
                filePath: context.filePath
            });

            // Emit ImportStarted
            await context.progressEmitter.emitStarted(
                "initialization",
                context.statistics,
                context.metadata
            );

            // Execute the pipeline
            const result = await this.pipeline.execute(context);

            // Check cancellation before completion
            context.cancellationToken.throwIfCancelled();

            // Emit ImportCompleted
            await context.progressEmitter.emitCompleted(
                context.statistics,
                context.metadata
            );

            this.logger.info("Import Orchestrator execution completed successfully", {
                requestId: context.requestId,
                importId: context.importId,
                durationMs: result.duration
            });

            return result;
        } catch (error) {
            const completedAt = new Date();
            const duration = completedAt.getTime() - context.startedAt.getTime();
            stats.completedAt = completedAt;
            stats.duration = duration;

            if (error instanceof CancellationError) {
                this.logger.warn("Import Orchestrator execution cancelled", {
                    requestId: context.requestId,
                    importId: context.importId,
                    reason: error.message
                });

                await context.progressEmitter.emitCancelled(
                    error.message,
                    context.statistics,
                    context.metadata
                );

                throw error;
            } else {
                stats.failedBatches = (stats.totalBatches || 0) - (stats.completedBatches || 0);

                const orchestratorError = this.wrapError(error);

                this.logger.error("Import Orchestrator execution failed", orchestratorError, {
                    requestId: context.requestId,
                    importId: context.importId
                });

                await context.progressEmitter.emitFailed(
                    orchestratorError,
                    context.statistics,
                    context.metadata
                );

                throw orchestratorError;
            }
        }
    }

    private validateContext(context: ImportContext): void {
        if (!context.importId) {
            throw new ValidationError("Import ID is required in the import context");
        }
        if (!context.filePath) {
            throw new ValidationError("File path is required in the import context");
        }
        if (!context.provider) {
            throw new ValidationError("AI Provider is required in the import context");
        }
        if (!context.model) {
            throw new ValidationError("AI Model is required in the import context");
        }
        if (context.batchSize <= 0) {
            throw new ValidationError("Batch size must be greater than 0");
        }
    }

    private wrapError(error: unknown): Error {
        if (error instanceof OrchestratorError) {
            return error;
        }
        if (error instanceof CancellationError) {
            return error;
        }

        const originalError = error instanceof Error ? error : undefined;
        const message = originalError ? originalError.message : String(error);

        return new UnexpectedOrchestratorError(
            "An unexpected error occurred during import orchestration: " + message,
            originalError
        );
    }
}
