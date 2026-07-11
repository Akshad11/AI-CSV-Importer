import { Request, Response } from "express";
import { z } from "zod";
import { importerService } from "./importer.service";
import { ApiResponse } from "../../responses/apiResponse";
import { AppError } from "../../errors/AppError";
import { logger } from "../../logger/logger";
import { globalContainer } from "../../container/globalContainer";
import { SettingsRepository } from "../../database/repositories/SettingsRepository";
import { ProviderRepository } from "../../database/repositories/ProviderRepository";
import { ModelRepository } from "../../database/repositories/ModelRepository";
import { PromptRepository } from "../../database/repositories/PromptRepository";
import { ImportRepository } from "../../database/repositories/ImportRepository";
import { ImportRecordRepository } from "../../database/repositories/ImportRecordRepository";
import { SkippedRepository } from "../../database/repositories/SkippedRepository";
import { StatisticsRepository } from "../../database/repositories/StatisticsRepository";
import { LogRepository } from "../../database/repositories/LogRepository";
import { UserPreferenceRepository } from "../../database/repositories/UserPreferenceRepository";
import { EncryptedStorageService } from "../../utils/security";
import { RateLimitError } from "../../services/ai/errors/RateLimitError";

// Zod schemas for request validation
const settingsUpdateSchema = z.object({
    defaultAiProvider: z.string().optional(),
    defaultModel: z.string().optional(),
    batchSize: z.coerce.number().min(1).max(500).optional(),
    maxCsvSize: z.coerce.number().min(1024).optional(),
    maxRetries: z.coerce.number().min(0).max(10).optional(),
    timeout: z.coerce.number().min(1000).optional(),
    enableLogging: z.boolean().optional(),
    enableDebug: z.boolean().optional(),
    theme: z.enum(["light", "dark", "system"]).optional()
});

const providerCreateSchema = z.object({
    providerName: z.string().min(1),
    enabled: z.boolean().default(true),
    priority: z.coerce.number().default(0),
    apiKeyReference: z.string().optional(),
    endpoint: z.string().optional(),
    defaultModel: z.string().min(1),
    rateLimits: z.object({
        requestsPerMinute: z.coerce.number().optional(),
        tokensPerMinute: z.coerce.number().optional()
    }).optional(),
    retryPolicy: z.object({
        maxAttempts: z.coerce.number().optional(),
        initialDelayMs: z.coerce.number().optional()
    }).optional(),
    timeout: z.coerce.number().optional()
});

const modelCreateSchema = z.object({
    provider: z.string().min(1),
    modelName: z.string().min(1),
    displayName: z.string().min(1),
    maxTokens: z.coerce.number().default(4096),
    temperature: z.coerce.number().min(0).max(2).default(0.2),
    enabled: z.boolean().default(true),
    default: z.boolean().default(false),
    supportsJson: z.boolean().default(true),
    supportsFunctionCalling: z.boolean().default(false)
});

const promptCreateSchema = z.object({
    promptVersion: z.string().min(1),
    systemPrompt: z.string().min(1),
    userPrompt: z.string().min(1),
    description: z.string().optional(),
    enabled: z.boolean().default(true)
});

export class ImporterController {
    // ----------------------------------------------------
    // Legacy Importer Endpoints
    // ----------------------------------------------------
    async getStatus(_req: Request, res: Response) {
        const result = await importerService.getStatus();
        return ApiResponse.success(res, "Importer status fetched successfully.", result);
    }

    async upload(req: Request, res: Response) {
        if (!req.file) {
            throw new AppError("CSV file is required.", 400, "CSV_FILE_REQUIRED");
        }
        const result = await importerService.parseCsv(req.file.path);
        return ApiResponse.success(res, "CSV parsed successfully.", result);
    }

    async process(req: Request, res: Response) {
        if (!req.file) {
            throw new AppError("CSV file is required.", 400, "CSV_FILE_REQUIRED");
        }

        const provider = req.body.provider || "openai";
        const model = req.body.model || "gpt-4o-mini";
        const batchSize = parseInt(req.body.batchSize || "25", 10);
        
        let columnMappings: Record<string, string> = {};
        if (req.body.columnMappings) {
            try {
                columnMappings = typeof req.body.columnMappings === "string" 
                    ? JSON.parse(req.body.columnMappings)
                    : req.body.columnMappings;
            } catch (err) {
                throw new AppError("Invalid columnMappings JSON format.", 400, "INVALID_COLUMN_MAPPINGS");
            }
        }

        const confidenceThreshold = parseFloat(req.body.confidenceThreshold || "85");
        const defaultLeadSource = req.body.defaultLeadSource || "Organic Search";

        const result = await importerService.process({
            filePath: req.file.path,
            originalFileName: req.file.originalname,
            provider,
            model,
            batchSize,
            columnMappings,
            confidenceThreshold,
            defaultLeadSource,
        });

        return ApiResponse.success(res, "CSV processed with AI pipeline successfully.", result);
    }

    async logClientError(req: Request, res: Response) {
        const { requestId, error, status } = req.body;
        logger.error({
            requestId: requestId || req.requestId || "n/a",
            module: "Frontend",
            action: "Client Error Telemetry",
            status: "FAILED",
            message: `Frontend error (HTTP status: ${status || "unknown"}). Detail: ${typeof error === "object" ? JSON.stringify(error) : String(error)}`,
            error: error
        });
        return ApiResponse.success(res, "Client error logged successfully.");
    }

    async testAiConnection(req: Request, res: Response) {
        const { provider, model, prompt } = req.body;
        const requestId = req.requestId || "n/a";

        if (!provider) {
            return ApiResponse.error(res, 400, "AI provider is required.", "PROVIDER_REQUIRED");
        }
        if (!model) {
            return ApiResponse.error(res, 400, "AI model is required.", "MODEL_REQUIRED");
        }

        try {
            const result = await importerService.testAiConnection({
                provider,
                model,
                prompt: prompt || "Hello",
                requestId
            });

            return ApiResponse.success(res, "AI connection test successful.", result);
        } catch (err: any) {
            // Map common errors to friendly status codes/messages
            let statusCode = 503;
            let friendlyMessage = "Provider Unavailable";
            let retryAfter: number | undefined = undefined;

            const errMsg = err.message || "";
            const errLower = errMsg.toLowerCase();

            // Check if it's a RateLimitError
            if (err.name === "RateLimitError" || err instanceof RateLimitError || errLower.includes("rate limit") || errLower.includes("429") || errLower.includes("too many requests")) {
                statusCode = 429;
                friendlyMessage = "Rate Limit Exceeded";
                if (err.retryAfterSeconds) {
                    retryAfter = err.retryAfterSeconds;
                }
            } else if (errLower.includes("api key") || errLower.includes("401") || errLower.includes("403") || errLower.includes("unauthorized") || errLower.includes("invalid key") || errLower.includes("credentials")) {
                statusCode = 401;
                friendlyMessage = "Invalid API Key";
            } else if (errLower.includes("not found") || errLower.includes("404") || errLower.includes("model")) {
                statusCode = 404;
                friendlyMessage = "Model Not Found";
            } else if (errLower.includes("timeout") || errLower.includes("etimedout") || errLower.includes("deadline")) {
                statusCode = 504;
                friendlyMessage = "Timeout";
            }

            // Expose the retry-after value if present
            if (retryAfter !== undefined) {
                res.setHeader("Retry-After", String(retryAfter));
            }

            // Mask internal stack trace, only return provider info, success status and friendly message
            return ApiResponse.error(res, statusCode, friendlyMessage, "AI_CONNECTION_TEST_FAILED", {
                success: false,
                provider: provider.charAt(0).toUpperCase() + provider.slice(1),
                model,
                message: friendlyMessage,
                retryAfter
            });
        }
    }

    // ----------------------------------------------------
    // Application Settings APIs
    // ----------------------------------------------------
    async getSettings(_req: Request, res: Response) {
        const repo = globalContainer.resolve<SettingsRepository>("SettingsRepository");
        const settings = await repo.get();
        return ApiResponse.success(res, "Settings fetched successfully.", settings);
    }

    async updateSettings(req: Request, res: Response) {
        const parsed = settingsUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(`Validation failed: ${JSON.stringify(parsed.error.format())}`, 400, "VALIDATION_FAILED");
        }

        const repo = globalContainer.resolve<SettingsRepository>("SettingsRepository");
        const settings = await repo.update(parsed.data);
        return ApiResponse.success(res, "Settings updated successfully.", settings);
    }

    // ----------------------------------------------------
    // AI Providers APIs
    // ----------------------------------------------------
    async getProviders(_req: Request, res: Response) {
        const repo = globalContainer.resolve<ProviderRepository>("ProviderRepository");
        const providers = await repo.list();
        
        // Mask API keys reference in output
        const sanitized = providers.map(p => {
            const doc = p.toObject();
            if (doc.apiKeyReference) {
                doc.apiKeyReference = EncryptedStorageService.mask(EncryptedStorageService.decrypt(doc.apiKeyReference));
            }
            return doc;
        });

        return ApiResponse.success(res, "Providers fetched successfully.", sanitized);
    }

    async createProvider(req: Request, res: Response) {
        const parsed = providerCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(`Validation failed: ${JSON.stringify(parsed.error.format())}`, 400, "VALIDATION_FAILED");
        }

        const repo = globalContainer.resolve<ProviderRepository>("ProviderRepository");
        
        // Encrypt secret API key if provided
        const providerData = { ...parsed.data };
        if (providerData.apiKeyReference) {
            providerData.apiKeyReference = EncryptedStorageService.encrypt(providerData.apiKeyReference);
        }

        const provider = await repo.create(providerData);
        return ApiResponse.success(res, "Provider created successfully.", provider);
    }

    async updateProvider(req: Request, res: Response) {
        const id = req.params.id as string;
        const parsed = providerCreateSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(`Validation failed: ${JSON.stringify(parsed.error.format())}`, 400, "VALIDATION_FAILED");
        }

        const repo = globalContainer.resolve<ProviderRepository>("ProviderRepository");
        
        const updateData = { ...parsed.data };
        if (updateData.apiKeyReference) {
            updateData.apiKeyReference = EncryptedStorageService.encrypt(updateData.apiKeyReference);
        }

        const provider = await repo.update(id, updateData);
        if (!provider) {
            throw new AppError("Provider not found.", 404, "PROVIDER_NOT_FOUND");
        }

        return ApiResponse.success(res, "Provider updated successfully.", provider);
    }

    async deleteProvider(req: Request, res: Response) {
        const id = req.params.id as string;
        const repo = globalContainer.resolve<ProviderRepository>("ProviderRepository");
        const success = await repo.delete(id);
        if (!success) {
            throw new AppError("Provider not found.", 404, "PROVIDER_NOT_FOUND");
        }
        return ApiResponse.success(res, "Provider deleted successfully.");
    }

    // ----------------------------------------------------
    // AI Models APIs
    // ----------------------------------------------------
    async getModels(req: Request, res: Response) {
        const provider = req.query.provider as string;
        const repo = globalContainer.resolve<ModelRepository>("ModelRepository");
        const models = await repo.list({ provider });
        return ApiResponse.success(res, "Models fetched successfully.", models);
    }

    async createModel(req: Request, res: Response) {
        const parsed = modelCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(`Validation failed: ${JSON.stringify(parsed.error.format())}`, 400, "VALIDATION_FAILED");
        }

        const repo = globalContainer.resolve<ModelRepository>("ModelRepository");
        const model = await repo.create(parsed.data);
        return ApiResponse.success(res, "Model created successfully.", model);
    }

    async updateModel(req: Request, res: Response) {
        const id = req.params.id as string;
        const parsed = modelCreateSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(`Validation failed: ${JSON.stringify(parsed.error.format())}`, 400, "VALIDATION_FAILED");
        }

        const repo = globalContainer.resolve<ModelRepository>("ModelRepository");
        const model = await repo.update(id, parsed.data);
        if (!model) {
            throw new AppError("Model not found.", 404, "MODEL_NOT_FOUND");
        }
        return ApiResponse.success(res, "Model updated successfully.", model);
    }

    async deleteModel(req: Request, res: Response) {
        const id = req.params.id as string;
        const repo = globalContainer.resolve<ModelRepository>("ModelRepository");
        const success = await repo.delete(id);
        if (!success) {
            throw new AppError("Model not found.", 404, "MODEL_NOT_FOUND");
        }
        return ApiResponse.success(res, "Model deleted successfully.");
    }

    // ----------------------------------------------------
    // Prompt Configurations APIs
    // ----------------------------------------------------
    async getPrompts(_req: Request, res: Response) {
        const repo = globalContainer.resolve<PromptRepository>("PromptRepository");
        const prompts = await repo.list();
        return ApiResponse.success(res, "Prompts fetched successfully.", prompts);
    }

    async createPrompt(req: Request, res: Response) {
        const parsed = promptCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(`Validation failed: ${JSON.stringify(parsed.error.format())}`, 400, "VALIDATION_FAILED");
        }

        const repo = globalContainer.resolve<PromptRepository>("PromptRepository");
        const prompt = await repo.create(parsed.data);
        return ApiResponse.success(res, "Prompt created successfully.", prompt);
    }

    async updatePrompt(req: Request, res: Response) {
        const id = req.params.id as string;
        const parsed = promptCreateSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            throw new AppError(`Validation failed: ${JSON.stringify(parsed.error.format())}`, 400, "VALIDATION_FAILED");
        }

        const repo = globalContainer.resolve<PromptRepository>("PromptRepository");
        const prompt = await repo.update(id, parsed.data);
        if (!prompt) {
            throw new AppError("Prompt not found.", 404, "PROMPT_NOT_FOUND");
        }
        return ApiResponse.success(res, "Prompt updated successfully.", prompt);
    }

    async deletePrompt(req: Request, res: Response) {
        const id = req.params.id as string;
        const repo = globalContainer.resolve<PromptRepository>("PromptRepository");
        const success = await repo.delete(id);
        if (!success) {
            throw new AppError("Prompt not found.", 404, "PROMPT_NOT_FOUND");
        }
        return ApiResponse.success(res, "Prompt deleted successfully.");
    }

    // ----------------------------------------------------
    // Imports History & Detail Queries APIs
    // ----------------------------------------------------
    async getImports(req: Request, res: Response) {
        const repo = globalContainer.resolve<ImportRepository>("ImportRepository");
        
        const page = parseInt(req.query.page as string || "1", 10);
        const limit = parseInt(req.query.limit as string || "10", 10);
        const status = req.query.status as string;
        const provider = req.query.provider as string;
        const model = req.query.model as string;
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        const result = await repo.list({
            status,
            provider,
            model,
            startDate,
            endDate,
            page,
            limit
        });

        return ApiResponse.success(res, "Imports history fetched successfully.", {
            items: result.items,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            }
        });
    }

    async getImportDetails(req: Request, res: Response) {
        const id = req.params.id as string;
        const repo = globalContainer.resolve<ImportRepository>("ImportRepository");
        const details = await repo.findById(id);
        if (!details) {
            throw new AppError("Import job not found.", 404, "IMPORT_JOB_NOT_FOUND");
        }
        return ApiResponse.success(res, "Import job details fetched successfully.", details);
    }

    async deleteImport(req: Request, res: Response) {
        const id = req.params.id as string;
        const repo = globalContainer.resolve<ImportRepository>("ImportRepository");
        const success = await repo.delete(id);
        if (!success) {
            throw new AppError("Import job not found.", 404, "IMPORT_JOB_NOT_FOUND");
        }
        return ApiResponse.success(res, "Import job soft-deleted successfully.");
    }

    async getImportRecords(req: Request, res: Response) {
        const id = req.params.id as string;
        const repo = globalContainer.resolve<ImportRecordRepository>("ImportRecordRepository");

        const page = parseInt(req.query.page as string || "1", 10);
        const limit = parseInt(req.query.limit as string || "50", 10);
        const email = req.query.email as string;
        const mobile = req.query.mobile as string;
        const company = req.query.company as string;
        const crmStatus = req.query.crmStatus as string;
        const leadOwner = req.query.leadOwner as string;
        const country = req.query.country as string;

        const result = await repo.findByImportId(id, {
            email,
            mobile,
            company,
            crmStatus,
            leadOwner,
            country,
            page,
            limit
        });

        return ApiResponse.success(res, "Import records fetched successfully.", {
            items: result.items,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            }
        });
    }

    async getImportSkipped(req: Request, res: Response) {
        const id = req.params.id as string;
        const repo = globalContainer.resolve<SkippedRepository>("SkippedRepository");

        const page = parseInt(req.query.page as string || "1", 10);
        const limit = parseInt(req.query.limit as string || "50", 10);

        const result = await repo.findByImportId(id, limit, page);

        return ApiResponse.success(res, "Import skipped records fetched successfully.", {
            items: result.items,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            }
        });
    }

    async getImportStatistics(req: Request, res: Response) {
        const id = req.params.id as string;
        const repo = globalContainer.resolve<StatisticsRepository>("StatisticsRepository");
        const stats = await repo.findByImportId(id);
        if (!stats) {
            throw new AppError("Import statistics not found.", 404, "IMPORT_STATS_NOT_FOUND");
        }
        return ApiResponse.success(res, "Import statistics fetched successfully.", stats);
    }

    async getImportLogs(req: Request, res: Response) {
        const id = req.params.id as string;
        const repo = globalContainer.resolve<LogRepository>("LogRepository");
        const logs = await repo.findByImportId(id);
        return ApiResponse.success(res, "Import processing logs fetched successfully.", logs);
    }
}

export const importerController = new ImporterController();