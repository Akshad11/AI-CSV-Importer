import { ImportContext } from "../core/pipeline/ImportContext";
import { CrmLead } from "../schemas/crmLead.schema";
import { CsvRow } from "../services/csv/csv.types";
import { CsvBatch } from "../services/batch/batch.types";
import { AIResponse } from "../services/ai/ai.types";
import { IAIProviderResolver } from "../core/interfaces/IAIProviderResolver";
import { CsvParserService } from "../services/csv/csvParser.service";
import { BatchService } from "../services/batch/batch.service";
import { PromptBuilderService } from "../services/ai/promptBuilder.service";
import { ResponseValidatorService } from "../services/validation/responseValidator.service";
import { CancellationError } from "../core/cancellation/CancellationError";
import {
    OrchestratorStatistics,
    ImportResult,
    IStage,
    Pipeline,
    ImportStageError
} from "./Orchestrator.types";
import {
    ValidationError,
    AIProviderError,
    JsonParsingError,
    CsvParsingError,
    UnexpectedOrchestratorError
} from "./Orchestrator.errors";

export class ParserStage implements IStage<void, CsvRow> {
    readonly name = "parser";

    constructor(private readonly csvParser: CsvParserService) {}

    async *execute(input: AsyncIterable<void>, context: ImportContext): AsyncIterable<CsvRow> {
        context.logger.info("CSV Parsing Stage started", { 
            importId: context.importId, 
            requestId: context.requestId 
        });
        
        await context.progressEmitter.emitParsingStarted(context.statistics, context.metadata);

        let rowCount = 0;
        try {
            // Consume the trigger item
            for await (const _ of input) {
                // just trigger
            }

            context.cancellationToken.throwIfCancelled();
            const stream = this.csvParser.stream(context.filePath);
            
            for await (const row of stream) {
                context.cancellationToken.throwIfCancelled();
                rowCount++;
                yield row;
            }
        } catch (error) {
            if (error instanceof CancellationError) {
                throw error;
            }
            throw new CsvParsingError(
                "Failed to parse CSV file: " + (error as Error).message, 
                error as Error
            );
        }

        context.logger.info("CSV Parsing Stage completed", { 
            importId: context.importId, 
            requestId: context.requestId, 
            totalRows: rowCount 
        });

        const stats = context.statistics as any;
        stats.totalRows = rowCount;

        await context.updateProgress({ 
            totalRows: rowCount, 
            stage: "parsing" 
        });

        await context.progressEmitter.emitParsingCompleted(context.statistics, context.metadata);
    }
}

export class BatchStage implements IStage<CsvRow, CsvBatch> {
    readonly name = "batcher";

    constructor(private readonly batchService: BatchService) {}

    async *execute(input: AsyncIterable<CsvRow>, context: ImportContext): AsyncIterable<CsvBatch> {
        try {
            const batchStream = this.batchService.create(input, context.batchSize);
            
            for await (const batch of batchStream) {
                context.cancellationToken.throwIfCancelled();

                context.logger.info("Batch created", {
                    importId: context.importId,
                    requestId: context.requestId,
                    batchNumber: batch.batchNumber,
                    totalRows: batch.totalRows
                });

                const stats = context.statistics as any;
                stats.totalBatches = (stats.totalBatches || 0) + 1;

                await context.progressEmitter.emitBatchCreated(
                    batch.batchNumber,
                    batch.totalRows,
                    context.statistics,
                    context.metadata
                );

                yield batch;
            }
        } catch (error) {
            if (error instanceof CancellationError || error instanceof CsvParsingError) {
                throw error;
            }
            throw new UnexpectedOrchestratorError(
                "Failed during batching stage: " + (error as Error).message, 
                error as Error
            );
        }
    }
}

export class PromptStage implements IStage<CsvBatch, { batch: CsvBatch; prompt: { system: string; user: string } }> {
    readonly name = "prompt-builder";

    constructor(private readonly promptBuilder: PromptBuilderService) {}

    async *execute(
        input: AsyncIterable<CsvBatch>, 
        context: ImportContext
    ): AsyncIterable<{ batch: CsvBatch; prompt: { system: string; user: string } }> {
        for await (const batch of input) {
            context.cancellationToken.throwIfCancelled();

            context.logger.info("Batch processing started", {
                importId: context.importId,
                requestId: context.requestId,
                batchNumber: batch.batchNumber
            });

            await context.progressEmitter.emitBatchStarted(
                batch.batchNumber,
                batch.totalRows,
                context.statistics,
                context.metadata
            );

            context.logger.info("Building prompt for batch", {
                importId: context.importId,
                requestId: context.requestId,
                batchNumber: batch.batchNumber
            });

            const prompt = this.promptBuilder.build({ batch });
            yield { batch, prompt };
        }
    }
}

export class AIStage implements IStage<
    { batch: CsvBatch; prompt: { system: string; user: string } },
    { batch: CsvBatch; response: AIResponse<any> }
> {
    readonly name = "ai-generation";

    constructor(private readonly aiProviderResolver: IAIProviderResolver) {}

    async *execute(
        input: AsyncIterable<{ batch: CsvBatch; prompt: { system: string; user: string } }>,
        context: ImportContext
    ): AsyncIterable<{ batch: CsvBatch; response: AIResponse<any> }> {
        // Resolve provider
        const provider = this.aiProviderResolver.resolve(context.provider as any);

        for await (const item of input) {
            context.cancellationToken.throwIfCancelled();

            context.logger.info("AI request started", {
                importId: context.importId,
                requestId: context.requestId,
                batchNumber: item.batch.batchNumber
            });

            await context.progressEmitter.emitAIStarted(
                item.batch.batchNumber,
                context.provider,
                context.model,
                context.statistics,
                context.metadata
            );

            let response: AIResponse<any>;
            try {
                response = await provider.generate({
                    system: item.prompt.system,
                    user: item.prompt.user,
                    model: context.model
                });

                if (!response || !response.success) {
                    throw new Error(response?.data ? String(response.data) : "AI provider returned failure");
                }
            } catch (error) {
                if (error instanceof CancellationError) {
                    throw error;
                }
                throw new AIProviderError(
                    "AI provider generation failed: " + (error as Error).message, 
                    error as Error
                );
            }

            context.logger.info("AI request completed", {
                importId: context.importId,
                requestId: context.requestId,
                batchNumber: item.batch.batchNumber
            });

            const stats = context.statistics as any;
            stats.aiCalls = (stats.aiCalls || 0) + 1;
            if (response.usage?.totalTokens) {
                stats.totalTokens = (stats.totalTokens || 0) + response.usage.totalTokens;
            }

            await context.progressEmitter.emitAICompleted(
                item.batch.batchNumber,
                context.provider,
                context.model,
                context.statistics,
                context.metadata
            );

            yield { batch: item.batch, response };
        }
    }
}

export class ValidatorStage implements IStage<
    { batch: CsvBatch; response: AIResponse<any> },
    { batch: CsvBatch; validatedData: CrmLead[] }
> {
    readonly name = "validator";

    constructor(private readonly validator: ResponseValidatorService) {}

    async *execute(
        input: AsyncIterable<{ batch: CsvBatch; response: AIResponse<any> }>,
        context: ImportContext
    ): AsyncIterable<{ batch: CsvBatch; validatedData: CrmLead[] }> {
        for await (const item of input) {
            context.cancellationToken.throwIfCancelled();

            context.logger.info("Validation started", {
                importId: context.importId,
                requestId: context.requestId,
                batchNumber: item.batch.batchNumber
            });

            await context.progressEmitter.emitValidationStarted(
                context.statistics,
                context.metadata
            );

            let validatedData: CrmLead[];
            try {
                let responseStr: string;
                if (typeof item.response.data === "string") {
                    responseStr = item.response.data;
                } else {
                    responseStr = JSON.stringify(item.response.data);
                }

                validatedData = this.validator.validate(responseStr);
            } catch (error) {
                if (error instanceof CancellationError) {
                    throw error;
                }

                const errorMessage = (error as Error).message;
                if (error instanceof SyntaxError || errorMessage.includes("Unexpected token") || errorMessage.includes("No JSON array found")) {
                    throw new JsonParsingError(
                        `JSON parsing failed for batch ${item.batch.batchNumber}: ${errorMessage}`, 
                        error as Error
                    );
                } else {
                    throw new ValidationError(
                        `Validation failed for batch ${item.batch.batchNumber}: ${errorMessage}`, 
                        error as Error
                    );
                }
            }

            context.logger.info("Validation completed", {
                importId: context.importId,
                requestId: context.requestId,
                batchNumber: item.batch.batchNumber
            });

            await context.progressEmitter.emitValidationCompleted(
                context.statistics,
                context.metadata
            );

            yield { batch: item.batch, validatedData };
        }
    }
}

export class MapperStage implements IStage<
    { batch: CsvBatch; validatedData: CrmLead[] },
    { batch: CsvBatch; records: CrmLead[] }
> {
    readonly name = "mapper";

    async *execute(
        input: AsyncIterable<{ batch: CsvBatch; validatedData: CrmLead[] }>,
        context: ImportContext
    ): AsyncIterable<{ batch: CsvBatch; records: CrmLead[] }> {
        for await (const item of input) {
            context.cancellationToken.throwIfCancelled();

            const records = item.validatedData;

            // Update statistics
            const stats = context.statistics as any;
            stats.completedBatches = (stats.completedBatches || 0) + 1;
            stats.processedRows += item.batch.totalRows;
            stats.successfulRows += records.length;
            stats.failedRows += (item.batch.totalRows - records.length);

            const percentage = stats.totalRows > 0 
                ? Math.min(Math.round((stats.processedRows / stats.totalRows) * 100), 100)
                : 100;

            await context.updateProgress({
                processedRows: stats.processedRows,
                percentage,
                stage: "processing"
            });

            context.logger.info("Batch completed", {
                importId: context.importId,
                requestId: context.requestId,
                batchNumber: item.batch.batchNumber
            });

            await context.progressEmitter.emitBatchCompleted(
                item.batch.batchNumber,
                item.batch.totalRows,
                context.statistics,
                context.metadata
            );

            yield { batch: item.batch, records };
        }
    }
}

export class PipelineExecutor implements Pipeline {
    constructor(readonly stages: IStage[]) {}

    public async execute(context: ImportContext): Promise<ImportResult> {
        const crmRecords: CrmLead[] = [];
        const errors: ImportStageError[] = [];
        const warnings: string[] = [];

        // Initial input stream to trigger the parser
        const initialStream = (async function* () {
            yield;
        })();

        let stream: AsyncIterable<any> = initialStream;
        for (const stage of this.stages) {
            stream = stage.execute(stream, context);
        }

        // Consume the final stream
        for await (const batchResult of stream) {
            context.cancellationToken.throwIfCancelled();

            if (batchResult.records) {
                crmRecords.push(...batchResult.records);
            }
        }

        context.cancellationToken.throwIfCancelled();

        const completedAt = new Date();
        const duration = completedAt.getTime() - context.startedAt.getTime();

        const stats = context.statistics as any;
        stats.completedAt = completedAt;
        stats.duration = duration;

        return {
            success: true,
            importId: context.importId,
            status: "completed",
            processedRows: stats.processedRows,
            successfulRows: stats.successfulRows,
            failedRows: stats.failedRows,
            statistics: stats,
            crmRecords,
            errors,
            warnings,
            duration,
            startedAt: context.startedAt,
            completedAt
        };
    }
}
