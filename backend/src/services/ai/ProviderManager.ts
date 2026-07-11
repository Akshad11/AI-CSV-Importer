import { Container } from "../../container/container";
import { IAIProvider } from "./ai.provider";
import {
    AIRequest,
    AIResponse,
    AIStreamChunk,
    AIProviderHealth,
    ModelInformation
} from "./ai.types";
import { AIProviderType } from "./provider.factory";
import { IAIProviderResolver } from "../../core/interfaces/IAIProviderResolver";
import { RetryEngine } from "../../core/retry/RetryEngine";
import { CircuitBreaker } from "../../core/retry/CircuitBreaker";
import { RateLimiter } from "./rate.limiter";
import { RequestQueue } from "./AIRequestQueue";
import { ProviderHealthService } from "./ProviderHealthService";
import { MODEL_CONFIGS } from "./model.config";
import { EventBus } from "../../core/events/EventBus";
import { ILogger } from "../../core/interfaces/ILogger";
import { AIProviderError } from "./errors/AIProviderError";
import * as fs from "fs";
import * as path from "path";

function logToAiCallFile(details: {
    timestamp: Date;
    provider: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    status: "SUCCESS" | "FAILED";
    latencyMs: number;
    tokensUsed?: number;
    error?: string;
}) {
    try {
        const logDir = path.resolve(__dirname, "../../../logs");
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const filePath = path.join(logDir, "AiCall.txt");

        const logEntry = `------------------------------------------------------------
[${details.timestamp.toISOString()}]
PROVIDER: ${details.provider}
MODEL: ${details.model}
STATUS: ${details.status}
LATENCY: ${details.latencyMs}ms
TOKENS USED: ${details.tokensUsed !== undefined ? details.tokensUsed : "N/A"}
${details.error ? `ERROR: ${details.error}\n` : ""}SYSTEM PROMPT:
${details.systemPrompt}

USER PROMPT:
${details.userPrompt}
------------------------------------------------------------\n\n`;

        fs.appendFileSync(filePath, logEntry, "utf8");
    } catch (err) {
        console.error("Failed to write to AiCall.txt", err);
    }
}

const DEFAULT_MODELS: Record<string, string> = {
    gemini: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    openai: "gpt-5.4-mini",
    claude: "claude-3-5-sonnet",
    ollama: process.env.OLLAMA_MODEL || "llama3",
    mock: "mock-model",
    azure: "gpt-5.4-mini"
};

export class ResilientAIProvider implements IAIProvider {
    private readonly circuitBreakers: Record<string, CircuitBreaker>;
    private readonly rateLimiters: Record<string, RateLimiter>;
    private readonly requestQueue: RequestQueue;
    private readonly healthService: ProviderHealthService;
    private readonly fallbackOrder: AIProviderType[];

    constructor(
        private readonly preferredProvider: AIProviderType,
        private readonly container: Container,
        private readonly retryEngine: RetryEngine,
        private readonly eventBus?: EventBus,
        private readonly logger?: ILogger
    ) {
        // Hydrate fallback list from environment or defaults
        const orderStr = process.env.AI_FALLBACK_ORDER || "gemini,openai,ollama,mock";
        this.fallbackOrder = orderStr
            .split(",")
            .map((s) => s.trim().toLowerCase() as AIProviderType);

        // Initialize circuit breakers (3 failures threshold, 30s recovery timeout)
        this.circuitBreakers = {
            gemini: new CircuitBreaker(3, 30000, this.eventBus, "gemini"),
            openai: new CircuitBreaker(3, 30000, this.eventBus, "openai"),
            claude: new CircuitBreaker(3, 30000, this.eventBus, "claude"),
            ollama: new CircuitBreaker(3, 30000, this.eventBus, "ollama"),
            mock: new CircuitBreaker(3, 30000, this.eventBus, "mock"),
            azure: new CircuitBreaker(3, 30000, this.eventBus, "azure")
        };

        // Initialize rate limiters with default tokens & requests limits
        this.rateLimiters = {
            gemini: new RateLimiter({ requestsPerMinute: 15, tokensPerMinute: 1000000 }),
            openai: new RateLimiter({ requestsPerMinute: 200, tokensPerMinute: 100000 }),
            claude: new RateLimiter({ requestsPerMinute: 50, tokensPerMinute: 50000 }),
            ollama: new RateLimiter({ requestsPerMinute: 1000, tokensPerMinute: 1000000 }),
            mock: new RateLimiter({ requestsPerMinute: 10000, tokensPerMinute: 10000000 }),
            azure: new RateLimiter({ requestsPerMinute: 200, tokensPerMinute: 100000 })
        };

        // Centralized AI Request Queue (concurrency = 5, max queue = 200)
        const envConcurrency = process.env.AI_CONCURRENCY_LIMIT
            ? parseInt(process.env.AI_CONCURRENCY_LIMIT, 10)
            : 5;
        this.requestQueue = new RequestQueue(envConcurrency, 200);

        // Resolve or create ProviderHealthService singleton
        try {
            this.healthService = this.container.resolve<ProviderHealthService>("ProviderHealthService");
        } catch {
            this.healthService = new ProviderHealthService();
        }
    }

    public async generate<T = unknown>(request: AIRequest): Promise<AIResponse<T>> {
        const sequence = this.getFallbackSequence(this.preferredProvider);

        // Schedule execution through the centralized Priority / Concurrency Request Queue
        return this.requestQueue.enqueue(async () => {
            let lastError: any = null;

            for (const activeProvider of sequence) {
                const breaker = this.circuitBreakers[activeProvider];

                // 1. Bypass provider if circuit breaker is OPEN
                if (!breaker.allowExecution()) {
                    this.logger?.warn(
                        `[ResilientAIProvider] Skipping fallback provider [${activeProvider}] - Circuit is OPEN.`
                    );
                    continue;
                }

                // 2. Select appropriate model override for fallback provider
                const activeModel = this.resolveModelForProvider(activeProvider, request.model);

                // 3. Acquire rate limiter token slots (estimate tokens count)
                const rateLimiter = this.rateLimiters[activeProvider];
                const textLength = (request.system?.length || 0) + (request.user?.length || 0);
                const estimatedTokens = Math.max(1, Math.ceil(textLength / 4));

                await rateLimiter.acquire(estimatedTokens);

                this.logger?.info(
                    `[ResilientAIProvider] Attempting AI generation on [${activeProvider}] using model [${activeModel}]`
                );

                const start = Date.now();
                try {
                    // Resolve actual provider implementation from container
                    const rawProvider = this.resolveRawProvider(activeProvider);

                    const result = await rawProvider.generate<T>({
                        ...request,
                        model: activeModel
                    });

                    // Success tracking
                    breaker.recordSuccess();
                    this.healthService.recordSuccess(activeProvider, Date.now() - start);

                    this.logger?.info(
                        `[ResilientAIProvider] AI call succeeded on [${activeProvider}] in ${Date.now() - start}ms`
                    );

                    logToAiCallFile({
                        timestamp: new Date(),
                        provider: activeProvider,
                        model: activeModel,
                        systemPrompt: request.system,
                        userPrompt: request.user,
                        status: "SUCCESS",
                        latencyMs: Date.now() - start,
                        tokensUsed: result.usage?.totalTokens
                    });

                    return result;
                } catch (error: any) {
                    lastError = error;

                    // Record failure to circuit breaker and health stats
                    breaker.recordFailure();
                    this.healthService.recordFailure(activeProvider, error.message);

                    this.logger?.error(
                        `[ResilientAIProvider] AI call failed on [${activeProvider}]: ${error.message}`
                    );

                    logToAiCallFile({
                        timestamp: new Date(),
                        provider: activeProvider,
                        model: activeModel,
                        systemPrompt: request.system,
                        userPrompt: request.user,
                        status: "FAILED",
                        latencyMs: Date.now() - start,
                        error: error.message
                    });

                    // Publish fallback/switch event
                    if (this.eventBus) {
                        this.eventBus.publish("provider:switch" as any, {
                            from: activeProvider,
                            error: error.message,
                            timestamp: new Date()
                        });
                    }
                }
            }

            // If we ran out of providers
            throw new AIProviderError(
                `All AI providers in fallback sequence failed. Last error: ${lastError?.message || "unknown"}`,
                this.preferredProvider,
                request.model || "unknown",
                lastError
            );
        });
    }

    public async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
        // Fallback-less simple yield delegation for real-time streaming
        const rawProvider = this.resolveRawProvider(this.preferredProvider);
        yield* rawProvider.stream(request);
    }

    public async health(): Promise<AIProviderHealth> {
        try {
            const rawProvider = this.resolveRawProvider(this.preferredProvider);
            return await rawProvider.health();
        } catch (error: any) {
            return {
                available: false,
                configured: true,
                authenticated: false,
                error: error.message
            };
        }
    }

    public supportsStructuredOutput(): boolean {
        try {
            const rawProvider = this.resolveRawProvider(this.preferredProvider);
            return rawProvider.supportsStructuredOutput();
        } catch {
            return false;
        }
    }

    public supportsStreaming(): boolean {
        return true;
    }

    public async getModelInformation(model?: string): Promise<ModelInformation> {
        try {
            const rawProvider = this.resolveRawProvider(this.preferredProvider);
            return await rawProvider.getModelInformation(model);
        } catch {
            return MODEL_CONFIGS[model || "gemini-3.5-flash"] || MODEL_CONFIGS["gemini-3.5-flash"];
        }
    }

    private getFallbackSequence(preferred: AIProviderType): AIProviderType[] {
        if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
            const list = new Set<AIProviderType>();
            list.add(preferred);
            for (const p of this.fallbackOrder) {
                list.add(p);
            }
            return Array.from(list);
        }
        return [preferred];
    }

    private resolveModelForProvider(provider: string, requestedModel?: string): string {
        if (!requestedModel) {
            return DEFAULT_MODELS[provider] || "mock-model";
        }

        // If the requested model is compatible with the provider type, keep it.
        const isGeminiModel = requestedModel.toLowerCase().includes("gemini");
        const isOpenAiModel = requestedModel.toLowerCase().includes("gpt") || requestedModel.toLowerCase().includes("o1");
        const isClaudeModel = requestedModel.toLowerCase().includes("claude");
        const isOllamaModel = requestedModel.toLowerCase().includes("llama") || requestedModel.toLowerCase().includes("mistral");

        if (provider === "gemini" && isGeminiModel) return requestedModel;
        if (provider === "openai" && isOpenAiModel) return requestedModel;
        if (provider === "claude" && isClaudeModel) return requestedModel;
        if (provider === "ollama" && isOllamaModel) return requestedModel;

        // Otherwise return the fallback provider's default model
        return DEFAULT_MODELS[provider] || "mock-model";
    }

    private resolveRawProvider(providerType: string): IAIProvider {
        const tokenMap: Record<string, string> = {
            openai: "OpenAIProvider",
            gemini: "GeminiProvider",
            mock: "MockProvider",
            claude: "ClaudeProvider",
            azure: "AzureOpenAIProvider",
            ollama: "OllamaProvider"
        };
        const token = tokenMap[providerType];
        if (!token) {
            throw new Error(`Unsupported AI provider: ${providerType}`);
        }
        return this.container.resolve<IAIProvider>(token);
    }
}

export class ProviderManager implements IAIProviderResolver {
    public static inject = ["container", "config", "retryEngine", "eventBus", "logger"];

    constructor(
        private readonly container: Container,
        private readonly config: any,
        private readonly retryEngine: RetryEngine,
        private readonly eventBus?: EventBus,
        private readonly logger?: ILogger
    ) { }

    public resolve(providerType?: AIProviderType): IAIProvider {
        const preferred = providerType || (this.config.provider as AIProviderType);
        return new ResilientAIProvider(
            preferred,
            this.container,
            this.retryEngine,
            this.eventBus,
            this.logger
        );
    }
}
