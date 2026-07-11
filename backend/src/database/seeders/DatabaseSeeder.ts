import { globalContainer } from "../../container/globalContainer";
import { ProviderRepository } from "../repositories/ProviderRepository";
import { ModelRepository } from "../repositories/ModelRepository";
import { PromptRepository } from "../repositories/PromptRepository";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { UserPreferenceRepository } from "../repositories/UserPreferenceRepository";
import { SYSTEM_PROMPT } from "../../prompts/system.prompt";
import { IMPORTER_PROMPT } from "../../prompts/importer.prompt";
import { logger } from "../../logger/logger";

export class DatabaseSeeder {
    public static async seed(): Promise<void> {
        logger.info("Checking database seeding status...", {
            module: "Database",
            action: "Seed",
            status: "PENDING"
        });

        try {
            const providerRepo = globalContainer.resolve<ProviderRepository>("ProviderRepository");
            const modelRepo = globalContainer.resolve<ModelRepository>("ModelRepository");
            const promptRepo = globalContainer.resolve<PromptRepository>("PromptRepository");
            const settingsRepo = globalContainer.resolve<SettingsRepository>("SettingsRepository");
            const userPrefRepo = globalContainer.resolve<UserPreferenceRepository>("UserPreferenceRepository");

            // 1. Seed AI Providers
            const providers = await providerRepo.list();
            if (providers.length === 0) {
                logger.info("Seeding default AI Providers...", { module: "Database", action: "SeedProviders", status: "PENDING" });
                await providerRepo.create({
                    providerName: "openai",
                    enabled: true,
                    priority: 1,
                    defaultModel: "gpt-5-mini",
                    timeout: 30000,
                    rateLimits: { requestsPerMinute: 60, tokensPerMinute: 150000 },
                    retryPolicy: { maxAttempts: 3, initialDelayMs: 1000 }
                });
                await providerRepo.create({
                    providerName: "gemini",
                    enabled: true,
                    priority: 2,
                    defaultModel: "gemini-3.5-flash",
                    timeout: 30000,
                    rateLimits: { requestsPerMinute: 15, tokensPerMinute: 1000000 },
                    retryPolicy: { maxAttempts: 3, initialDelayMs: 1000 }
                });
                await providerRepo.create({
                    providerName: "ollama",
                    enabled: true,
                    priority: 3,
                    defaultModel: "ollama-local",
                    timeout: 60000,
                    rateLimits: { requestsPerMinute: 100, tokensPerMinute: 200000 },
                    retryPolicy: { maxAttempts: 2, initialDelayMs: 500 }
                });
                await providerRepo.create({
                    providerName: "mock",
                    enabled: true,
                    priority: 4,
                    defaultModel: "mock-model",
                    timeout: 10000
                });
            }

            // 2. Seed AI Models
            const models = await modelRepo.list();
            if (models.length === 0) {
                logger.info("Seeding default AI Models...", { module: "Database", action: "SeedModels", status: "PENDING" });
                // OpenAI
                await modelRepo.create({ provider: "openai", modelName: "gpt-5", displayName: "ChatGPT-5", maxTokens: 8192, temperature: 0.2, enabled: true, default: false, supportsJson: true });
                await modelRepo.create({ provider: "openai", modelName: "gpt-5-mini", displayName: "ChatGPT-5 Mini", maxTokens: 4096, temperature: 0.2, enabled: true, default: true, supportsJson: true });
                await modelRepo.create({ provider: "openai", modelName: "gpt-4o", displayName: "ChatGPT-4o", maxTokens: 4096, temperature: 0.2, enabled: true, default: false, supportsJson: true });
                
                // Gemini
                await modelRepo.create({ provider: "gemini", modelName: "gemini-3.5-flash", displayName: "Gemini 3.5 Flash", maxTokens: 8192, temperature: 0.2, enabled: true, default: true, supportsJson: true });
                await modelRepo.create({ provider: "gemini", modelName: "gemini-1.5-flash", displayName: "Gemini 1.5 Flash", maxTokens: 8192, temperature: 0.2, enabled: true, default: false, supportsJson: true });
                await modelRepo.create({ provider: "gemini", modelName: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro", maxTokens: 8192, temperature: 0.2, enabled: true, default: false, supportsJson: true });

                // Ollama
                await modelRepo.create({ provider: "ollama", modelName: "ollama-local", displayName: "Local Model via Ollama", maxTokens: 2048, temperature: 0.2, enabled: true, default: true, supportsJson: false });

                // Mock
                await modelRepo.create({ provider: "mock", modelName: "mock-model", displayName: "Mock Local Extractor", maxTokens: 1000, temperature: 0.0, enabled: true, default: true, supportsJson: true });
            }

            // 3. Seed Prompt Configurations
            const prompts = await promptRepo.list();
            if (prompts.length === 0) {
                logger.info("Seeding default Prompt Configuration...", { module: "Database", action: "SeedPrompts", status: "PENDING" });
                await promptRepo.create({
                    promptVersion: "v1.0.0",
                    systemPrompt: SYSTEM_PROMPT.trim(),
                    userPrompt: IMPORTER_PROMPT.trim(),
                    description: "Initial production instruction sets for AI CSV parsing pipeline.",
                    enabled: true
                });
            }

            // 4. Seed Settings & Preferences
            await settingsRepo.get().then(async (doc) => {
                if (doc.isNew) {
                    await doc.save();
                    logger.info("Seeding default Application Settings...", { module: "Database", action: "SeedSettings", status: "SUCCESS" });
                }
            });

            await userPrefRepo.get().then(async (doc) => {
                if (doc.isNew) {
                    await doc.save();
                    logger.info("Seeding default User Preferences...", { module: "Database", action: "SeedPreferences", status: "SUCCESS" });
                }
            });

            logger.info("Database seeding verification completed successfully", {
                module: "Database",
                action: "Seed",
                status: "SUCCESS"
            });
        } catch (error: any) {
            logger.error(`Database seeding failed: ${error.message}`, error, {
                module: "Database",
                action: "Seed",
                status: "FAILED"
            });
        }
    }
}
