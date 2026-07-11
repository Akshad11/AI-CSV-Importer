import fs from "node:fs";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { csvParserService } from "../../services/csv/csvParser.service";
import { ImportOrchestrator } from "../../orchestrator/ImportOrchestrator";
import { ImportContext } from "../../core/pipeline/ImportContext";
import { Container } from "../../container/container";
import { AIProviderResolver } from "../../services/ai/provider.resolver";
import { ProviderManager } from "../../services/ai/ProviderManager";
import { ProviderHealthService } from "../../services/ai/ProviderHealthService";
import { BatchService } from "../../services/batch/batch.service";
import { PromptBuilderService } from "../../services/ai/promptBuilder.service";
import { ResponseValidatorService } from "../../services/validation/responseValidator.service";
import { EventBus } from "../../core/events/EventBus";
import { logger } from "../../logger/logger";
import { globalContainer } from "../../container/globalContainer";
import { IAIProviderResolver } from "../../core/interfaces/IAIProviderResolver";
import { ImportRepository } from "../../database/repositories/ImportRepository";
import { ImportRecordRepository } from "../../database/repositories/ImportRecordRepository";
import { SkippedRepository } from "../../database/repositories/SkippedRepository";
import { StatisticsRepository } from "../../database/repositories/StatisticsRepository";
import { LogRepository } from "../../database/repositories/LogRepository";
import { SettingsRepository } from "../../database/repositories/SettingsRepository";

// Static imports of AI Providers and retry engine to comply with ESM resolution
import { RetryEngine } from "../../core/retry/RetryEngine";
import { OpenAIProvider } from "../../services/ai/providers/openai.provider";
import { GeminiProvider } from "../../services/ai/providers/gemini.provider";
import { MockProvider } from "../../services/ai/providers/mock.provider";
import { OllamaProvider } from "../../services/ai/providers/ollama.provider";
import { ClaudeProvider } from "../../services/ai/providers/claude.provider";
import { AzureOpenAIProvider } from "../../services/ai/providers/azure.provider";

export class ImporterService {
    async getStatus() {
        const openaiKey = process.env.OPENAI_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        const localLlamaUrl = process.env.LOCAL_LLAMA_URL || process.env.LOCAL_LLAMA_AVAILABLE;

        const hasOpenAI = !!openaiKey && openaiKey.trim() !== "" && openaiKey !== "your_api_key_here";
        const hasGemini = !!geminiKey && geminiKey.trim() !== "" && geminiKey !== "your_api_key_here";
        const hasLocal = !!localLlamaUrl && localLlamaUrl.trim() !== "" && localLlamaUrl !== "false";

        let preferredConfig = {
            defaultAiProvider: "gemini",
            defaultModel: "gemini-3.5-flash"
        };
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                const settingsRepo = globalContainer.resolve<SettingsRepository>("SettingsRepository");
                const dbSettings = await settingsRepo.get();
                if (dbSettings) {
                    preferredConfig = {
                        defaultAiProvider: dbSettings.defaultAiProvider || "gemini",
                        defaultModel: dbSettings.defaultModel || "gemini-3.5-flash"
                    };
                }
            } catch (err: any) {
                logger.warn({
                    module: "ImporterService",
                    action: "GetStatusSettings",
                    status: "FAILED",
                    message: "Failed to fetch settings from database inside getStatus: " + err.message,
                    error: err
                });
            }
        }

        return {
            status: "ready",
            message: "Importer module is initialized.",
            providers: {
                openai: hasOpenAI,
                gemini: hasGemini,
                ollama: hasLocal,
                mock: true
            },
            preferredConfig
        };
    }

    async testAiConnection(options: {
        provider: string;
        model: string;
        prompt: string;
        requestId?: string;
    }) {
        const provider = options.provider || "openai";
        const model = options.model;
        const prompt = options.prompt || "Hello";
        const requestId = options.requestId || randomUUID();
        const startTimestamp = Date.now();

        const eventBus = new EventBus();

        // Build DI container for AI Provider Resolver
        const container = new Container();
        container.registerSingleton("container", container);
        container.registerSingleton("config", { provider });
        container.registerSingleton("eventBus", eventBus);
        container.registerSingleton("logger", logger);
        
        // Register retry engine
        container.registerSingleton("retryEngine", new RetryEngine(undefined, eventBus, logger));

        // Register health tracking service
        container.registerSingleton("ProviderHealthService", new ProviderHealthService());

        // Register providers
        container.registerSingleton("OpenAIProvider", OpenAIProvider);
        container.registerSingleton("GeminiProvider", GeminiProvider);
        container.registerSingleton("MockProvider", MockProvider);
        container.registerSingleton("OllamaProvider", OllamaProvider);
        container.registerSingleton("ClaudeProvider", ClaudeProvider);
        container.registerSingleton("AzureOpenAIProvider", AzureOpenAIProvider);
        container.registerSingleton("aiProviderResolver", ProviderManager);

        const resolver = container.resolve<IAIProviderResolver>("aiProviderResolver");
        const resolvedProvider = resolver.resolve(provider as any);

        logger.info({
            requestId,
            module: "AI Connection Test",
            action: "Test Connection",
            status: "PENDING",
            message: `Initiating connection test for AI provider [${provider}] with model [${model}]...`,
            provider,
            model
        });

        try {
            const response = await resolvedProvider.generate({
                system: "You are a helpful AI assistant.",
                user: prompt,
                model: model
            });

            if (!response || !response.success) {
                throw new Error(response?.data ? String(response.data) : "AI provider returned failure");
            }

            const latencyMs = Date.now() - startTimestamp;

            logger.info({
                requestId,
                module: "AI Connection Test",
                action: "Test Connection",
                status: "SUCCESS",
                message: `AI Connection Test succeeded for provider ${provider} and model ${model}. Latency: ${latencyMs}ms`,
                latencyMs,
                provider,
                model,
                tokens: response.usage
            });

            return {
                success: true,
                provider: provider.charAt(0).toUpperCase() + provider.slice(1),
                model: model,
                response: response.data || "",
                latencyMs,
                tokens: {
                    prompt: response.usage?.promptTokens || 0,
                    completion: response.usage?.completionTokens || 0,
                    total: response.usage?.totalTokens || 0
                }
            };
        } catch (err: any) {
            logger.error({
                requestId,
                module: "AI Connection Test",
                action: "Test Connection",
                status: "FAILED",
                message: `AI Connection Test failed for provider ${provider} and model ${model}: ${err.message}`,
                error: err,
                provider,
                model
            });
            throw err;
        }
    }

    async parseCsv(filePath: string) {
        return csvParserService.stream(filePath);
    }

    async process(options: {
        filePath: string;
        originalFileName: string;
        provider: string;
        model: string;
        batchSize: number;
        columnMappings?: Record<string, string>;
        confidenceThreshold?: number;
        defaultLeadSource?: string;
    }) {
        const provider = options.provider || "openai";
        let model = options.model || "gpt-4o-mini";
        if (provider === "gemini" && process.env.GEMINI_MODEL) {
            model = process.env.GEMINI_MODEL;
        } else if (provider === "ollama" && process.env.OLLAMA_MODEL) {
            model = process.env.OLLAMA_MODEL;
        }
        const batchSize = options.batchSize || 25;
        const eventBus = new EventBus();
        const startTimestamp = Date.now();
        const importId = randomUUID();
        const requestId = randomUUID();

        // Build DI container for AI Provider Resolver
        const container = new Container();
        container.registerSingleton("container", container);
        container.registerSingleton("config", { provider });
        container.registerSingleton("eventBus", eventBus);
        container.registerSingleton("logger", logger);
        
        // Register retry engine
        container.registerSingleton("retryEngine", new RetryEngine(undefined, eventBus, logger));

        // Register health tracking service
        container.registerSingleton("ProviderHealthService", new ProviderHealthService());

        // Register providers
        container.registerSingleton("OpenAIProvider", OpenAIProvider);
        container.registerSingleton("GeminiProvider", GeminiProvider);
        container.registerSingleton("MockProvider", MockProvider);
        container.registerSingleton("OllamaProvider", OllamaProvider);
        container.registerSingleton("ClaudeProvider", ClaudeProvider);
        container.registerSingleton("AzureOpenAIProvider", AzureOpenAIProvider);
        container.registerSingleton("aiProviderResolver", ProviderManager);

        // MongoDB Repositories
        const importRepo = globalContainer.resolve<ImportRepository>("ImportRepository");
        const logRepo = globalContainer.resolve<LogRepository>("LogRepository");
        const recordRepo = globalContainer.resolve<ImportRecordRepository>("ImportRecordRepository");
        const skippedRepo = globalContainer.resolve<SkippedRepository>("SkippedRepository");
        const statsRepo = globalContainer.resolve<StatisticsRepository>("StatisticsRepository");

        // Helper to record ProcessingLog documents
        const saveProcessLog = async (level: string, action: string, message: string, extra: any = {}) => {
            try {
                await logRepo.create({
                    importId,
                    level,
                    module: "Pipeline",
                    action,
                    message,
                    requestId,
                    stackTrace: extra.error?.stack,
                    timestamp: new Date()
                });
            } catch (err) {
                logger.error("Failed to save processing log to MongoDB", err);
            }
        };

        // Create the ImportJob record in database
        let fileSize = 0;
        try {
            const fileStats = fs.statSync(options.filePath);
            fileSize = fileStats.size;
        } catch {}

        await importRepo.create({
            importId,
            filename: options.filePath,
            originalFilename: options.originalFileName,
            fileSize,
            rows: 0,
            columns: [],
            status: "parsing",
            startedAt: new Date(startTimestamp),
            aiProvider: provider,
            aiModel: model,
            promptVersion: "v1.0.0",
            batchSize
        });

        // Wire event subscriptions to capture metrics and logs
        eventBus.subscribe("import:started", async () => {
            await saveProcessLog("INFO", "Import Started", "CSV Ingestion pipeline execution started.");
        });
        eventBus.subscribe("parsing:started", async () => {
            await saveProcessLog("INFO", "Parsing Started", "CSV parsing phase started.");
            await importRepo.update(importId, { status: "parsing" });
        });
        eventBus.subscribe("parsing:completed", async (p) => {
            await saveProcessLog("INFO", "Parsing Completed", `CSV parsing completed. Total rows parsed: ${p.statistics?.totalRows || 0}`);
            await importRepo.update(importId, { rows: p.statistics?.totalRows || 0 });
        });
        eventBus.subscribe("batch:created", async (p) => {
            await saveProcessLog("INFO", "Batch Created", `Batch ${p.batchNumber} created containing ${p.totalRows} rows.`);
        });
        eventBus.subscribe("batch:started", async (p) => {
            await saveProcessLog("INFO", "Batch Started", `Batch ${p.batchNumber} process started.`);
        });
        eventBus.subscribe("batch:completed", async (p) => {
            await saveProcessLog("INFO", "Batch Completed", `Batch ${p.batchNumber} process completed.`);
        });
        eventBus.subscribe("ai:started", async (p) => {
            await saveProcessLog("INFO", "AI Started", `AI request for batch ${p.batchNumber} using provider ${p.provider} and model ${p.model}.`);
        });
        eventBus.subscribe("ai:completed", async (p) => {
            await saveProcessLog("INFO", "AI Completed", `AI response mapping finished for batch ${p.batchNumber}.`);
        });
        eventBus.subscribe("validation:started", async () => {
            await saveProcessLog("INFO", "Validation Started", "Validating response schema schema constraints.");
        });
        eventBus.subscribe("validation:completed", async () => {
            await saveProcessLog("INFO", "Validation Completed", "Response constraints successfully verified.");
        });
        eventBus.subscribe("retry:attempt", async (p) => {
            await saveProcessLog("WARNING", "Retry Attempt", `Retrying operation [${p.operation}]. Attempt ${p.attempt}. Error: ${p.error?.message}`, { error: p.error });
        });
        eventBus.subscribe("retry:failed", async (p) => {
            await saveProcessLog("ERROR", "Retry Failed", `Operation [${p.operation}] failed. Error: ${p.error?.message}`, { error: p.error });
        });
        eventBus.subscribe("import:completed", async () => {
            await saveProcessLog("SUCCESS", "Import Completed", "CSV Ingestion pipeline successfully completed.");
        });
        eventBus.subscribe("import:failed", async (p) => {
            await saveProcessLog("FATAL", "Import Failed", `CSV Ingestion pipeline failed: ${p.error.message}`, { error: p.error });
            await importRepo.update(importId, { status: "failed", completedAt: new Date() });
        });

        const context = new ImportContext({
            importId,
            requestId,
            provider,
            model,
            batchSize,
            filePath: options.filePath,
            originalFileName: options.originalFileName,
            eventBus,
            logger
        });

        const orchestrator = new ImportOrchestrator({
            csvParser: csvParserService,
            batchService: new BatchService(),
            promptBuilder: new PromptBuilderService(),
            aiProviderResolver: container.resolve<any>("aiProviderResolver"),
            validator: new ResponseValidatorService(),
            eventBus,
            logger
        });

        // Run the orchestrator!
        let result: any;
        try {
            result = await orchestrator.execute(context);
        } catch (err: any) {
            await importRepo.update(importId, { status: "failed", completedAt: new Date() });
            try {
                await fs.promises.unlink(options.filePath);
            } catch {}
            throw err;
        }

        const durationMs = Date.now() - startTimestamp;

        // Read original rows to calculate skipped records and assign correct row numbers
        const originalRows: any[] = [];
        for await (const row of csvParserService.stream(options.filePath)) {
            originalRows.push(row);
        }

        const mappings = options.columnMappings || {};
        const confidenceThreshold = options.confidenceThreshold || 85;
        const defaultLeadSource = options.defaultLeadSource || "Organic Search";

        // Find the original headers corresponding to email and mobile
        let emailHeader = "";
        let mobileHeader = "";
        for (const [csvHeader, crmField] of Object.entries(mappings)) {
            if (crmField === "email") emailHeader = csvHeader;
            if (crmField === "mobile_without_country_code") mobileHeader = csvHeader;
        }

        const crmRecords: any[] = [];
        const skippedRecords: any[] = [];

        // Helper to normalize and check strings
        const normalize = (val: any) => String(val || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

        let unmatchedAI = [...result.crmRecords];

        // Match original rows with AI extracted records
        originalRows.forEach((row, index) => {
            const rowNumber = index + 1;
            const rawEmail = emailHeader ? row[emailHeader] : "";
            const rawMobile = mobileHeader ? row[mobileHeader] : "";

            const hasEmailVal = !!rawEmail && String(rawEmail).trim() !== "";
            const hasMobileVal = !!rawMobile && String(rawMobile).trim() !== "";

            // Check if record contains neither identifier -> skipped automatically
            if (!hasEmailVal && !hasMobileVal) {
                skippedRecords.push({
                    id: `skipped-${rowNumber}`,
                    rowNumber,
                    originalRow: row,
                    reason: "Skipped: Missing Identifier",
                    validationIssue: "Record contains neither email address nor mobile number."
                });
                return;
            }

            // Find matching AI record
            let matchedIndex = unmatchedAI.findIndex((rec) => {
                const emailMatch = rec.email && rawEmail && normalize(rec.email) === normalize(rawEmail);
                const mobileMatch = rec.mobile_without_country_code && rawMobile && normalize(rec.mobile_without_country_code) === normalize(rawMobile);
                return emailMatch || mobileMatch;
            });

            if (matchedIndex !== -1) {
                // Found matched AI record!
                const rec = unmatchedAI[matchedIndex] as any;
                unmatchedAI.splice(matchedIndex, 1);

                // Assign row number
                rec.rowNumber = rowNumber;
                
                // Add fallback confidence and defaults if missing
                if (!rec.confidence) {
                    rec.confidence = this.calculateConfidence(rec);
                }
                if (!rec.data_source) {
                    rec.data_source = defaultLeadSource;
                }
                
                crmRecords.push(rec);
            } else {
                // If not found in AI outputs, it's skipped by AI
                skippedRecords.push({
                    id: `skipped-${rowNumber}`,
                    rowNumber,
                    originalRow: row,
                    reason: "Skipped: AI Omission",
                    validationIssue: "The AI extraction stage did not produce a valid lead for this row."
                });
            }
        });

        // Any leftover unmatched records from AI output
        unmatchedAI.forEach((rec: any, idx) => {
            rec.rowNumber = originalRows.length + idx + 1;
            if (!rec.confidence) {
                rec.confidence = this.calculateConfidence(rec);
            }
            if (!rec.data_source) {
                rec.data_source = defaultLeadSource;
            }
            crmRecords.push(rec);
        });

        // Calculate statistics
        const warningCount = crmRecords.filter((r) => r.confidence < confidenceThreshold).length;
        const processingTime = durationMs / 1000;
        const recordsPerSecond = parseFloat((originalRows.length / (processingTime || 1)).toFixed(1));

        let costPerRowUsd = 0.0001;
        if (provider === "openai") costPerRowUsd = 0.0005;
        else if (provider === "gemini") costPerRowUsd = 0.00015;
        else if (provider === "ollama") costPerRowUsd = 0.0;
        const totalCost = parseFloat((crmRecords.length * costPerRowUsd * 83.0).toFixed(4));

        const averageConfidence = crmRecords.length > 0
            ? Math.round(crmRecords.reduce((sum, r) => sum + (r.confidence || 90), 0) / crmRecords.length)
            : 0;

        const statistics = {
            imported: crmRecords.length,
            skipped: skippedRecords.length,
            failed: skippedRecords.length,
            warnings: warningCount,
            processingTime,
            averageConfidence,
            recordsPerSecond,
            totalCost
        };

        // 1. Bulk save ImportRecords
        if (crmRecords.length > 0) {
            const recordsToSave = crmRecords.map((rec) => ({
                importId,
                originalRowNumber: rec.rowNumber,
                name: rec.name || "Unknown",
                email: rec.email,
                countryCode: rec.country_code,
                mobile: rec.mobile_without_country_code,
                company: rec.company,
                city: rec.city,
                state: rec.state,
                country: rec.country,
                leadOwner: rec.lead_owner,
                crmStatus: rec.status,
                crmNote: rec.notes,
                dataSource: rec.data_source,
                possessionTime: rec.possession_time,
                description: rec.description,
                aiConfidence: rec.confidence,
                mappedFields: rec,
                validationResult: { confidence: rec.confidence }
            }));
            await recordRepo.insertMany(recordsToSave as any);
        }

        // 2. Bulk save SkippedRecords
        if (skippedRecords.length > 0) {
            const skipsToSave = skippedRecords.map((sk) => ({
                importId,
                originalRow: sk.originalRow,
                reason: sk.reason,
                validationErrors: sk.validationIssue ? [sk.validationIssue] : [],
                timestamp: new Date()
            }));
            await skippedRepo.insertMany(skipsToSave as any);
        }

        // 3. Save ImportStatistics
        await statsRepo.create({
            importId,
            rows: originalRows.length,
            imported: crmRecords.length,
            skipped: skippedRecords.length,
            warnings: warningCount,
            errorCount: skippedRecords.length,
            duration: durationMs,
            averageBatchTime: durationMs / Math.ceil(originalRows.length / batchSize),
            averageAiResponseTime: durationMs / Math.ceil(originalRows.length / batchSize),
            estimatedCost: totalCost,
            tokenUsage: {
                totalTokens: result.statistics?.totalTokens || 0,
                promptTokens: 0,
                completionTokens: 0
            }
        });

        // 4. Update ImportJob
        const successRate = originalRows.length > 0 
            ? Math.round((crmRecords.length / originalRows.length) * 100) 
            : 0;

        const columns = originalRows.length > 0 ? Object.keys(originalRows[0]) : [];

        await importRepo.update(importId, {
            status: "completed",
            completedAt: new Date(),
            duration: durationMs,
            totalImported: crmRecords.length,
            totalSkipped: skippedRecords.length,
            successRate,
            columns
        });

        try {
            await fs.promises.unlink(options.filePath);
        } catch (err) {
            logger.warn(`Could not clean up uploaded file: ${options.filePath}`, { error: err });
        }

        return {
            records: crmRecords,
            skipped: skippedRecords,
            statistics,
            processingTime
        };
    }

    private calculateConfidence(record: any): number {
        let score = 100;
        if (!record.email) score -= 15;
        if (!record.mobile_without_country_code) score -= 15;
        if (!record.company || record.company.toLowerCase().includes("unknown")) score -= 15;
        if (!record.name || record.name.toLowerCase().includes("unknown")) score -= 15;
        if (!record.city) score -= 5;
        if (!record.state) score -= 5;
        if (!record.country) score -= 5;
        return Math.max(50, score);
    }
}

export const importerService = new ImporterService();