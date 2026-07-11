import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { csvParserService } from "../../services/csv/csvParser.service";
import { ImportOrchestrator } from "../../orchestrator/ImportOrchestrator";
import { ImportContext } from "../../core/pipeline/ImportContext";
import { Container } from "../../container/container";
import { AIProviderResolver } from "../../services/ai/provider.resolver";
import { BatchService } from "../../services/batch/batch.service";
import { PromptBuilderService } from "../../services/ai/promptBuilder.service";
import { ResponseValidatorService } from "../../services/validation/responseValidator.service";
import { EventBus } from "../../core/events/EventBus";
import { logger } from "../../logger/logger";

// Static imports of AI Providers and retry engine to comply with ESM resolution
import { RetryEngine } from "../../core/retry/RetryEngine";
import { OpenAIProvider } from "../../services/ai/providers/openai.provider";
import { GeminiProvider } from "../../services/ai/providers/gemini.provider";
import { MockProvider } from "../../services/ai/providers/mock.provider";
import { OllamaProvider } from "../../services/ai/providers/ollama.provider";
import { ClaudeProvider } from "../../services/ai/providers/claude.provider";
import { AzureOpenAIProvider } from "../../services/ai/providers/azure.provider";

export class ImporterService {
    getStatus() {
        const openaiKey = process.env.OPENAI_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        const localLlamaUrl = process.env.LOCAL_LLAMA_URL || process.env.LOCAL_LLAMA_AVAILABLE;

        const hasOpenAI = !!openaiKey && openaiKey.trim() !== "" && openaiKey !== "your_api_key_here";
        const hasGemini = !!geminiKey && geminiKey.trim() !== "" && geminiKey !== "your_api_key_here";
        const hasLocal = !!localLlamaUrl && localLlamaUrl.trim() !== "" && localLlamaUrl !== "false";

        return {
            status: "ready",
            message: "Importer module is initialized.",
            providers: {
                openai: hasOpenAI,
                gemini: hasGemini,
                ollama: hasLocal,
                mock: true
            }
        };
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
        const model = options.model || "gpt-4o-mini";
        const batchSize = options.batchSize || 25;

        // Build DI container for AI Provider Resolver
        const container = new Container();
        container.registerSingleton("container", container);
        container.registerSingleton("config", { provider });
        
        // Register retry engine
        container.registerSingleton("retryEngine", new RetryEngine());

        // Register providers
        container.registerSingleton("OpenAIProvider", OpenAIProvider);
        container.registerSingleton("GeminiProvider", GeminiProvider);
        container.registerSingleton("MockProvider", MockProvider);
        container.registerSingleton("OllamaProvider", OllamaProvider);
        container.registerSingleton("ClaudeProvider", ClaudeProvider);
        container.registerSingleton("AzureOpenAIProvider", AzureOpenAIProvider);
        container.registerSingleton("aiProviderResolver", AIProviderResolver);

        const eventBus = new EventBus();
        const startTimestamp = Date.now();

        const context = new ImportContext({
            importId: randomUUID(),
            requestId: randomUUID(),
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
            aiProviderResolver: container.resolve<AIProviderResolver>("aiProviderResolver"),
            validator: new ResponseValidatorService(),
            eventBus,
            logger
        });

        // Run the orchestrator!
        const result = await orchestrator.execute(context);
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