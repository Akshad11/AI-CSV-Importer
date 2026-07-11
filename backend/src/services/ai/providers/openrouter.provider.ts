import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { IAIProvider } from "../ai.provider";
import {
    AIRequest,
    AIResponse,
    AIStreamChunk,
    AIProviderHealth,
    ModelInformation
} from "../ai.types";
import { TokenUsageCalculator } from "../token.usage";
import { MODEL_CONFIGS } from "../model.config";
import { AIProviderError } from "../errors/AIProviderError";
import { RateLimitError } from "../errors/RateLimitError";
import { RetryEngine } from "../../../core/retry/RetryEngine";

export class OpenRouterProvider implements IAIProvider {
    public static inject = ["retryEngine"];

    private client: OpenAI | null = null;
    private readonly retryEngine: RetryEngine;

    constructor(retryEngine?: RetryEngine) {
        this.retryEngine = retryEngine || new RetryEngine();
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (apiKey) {
            this.client = new OpenAI({
                apiKey,
                baseURL: "https://openrouter.ai/api/v1",
                defaultHeaders: {
                    "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://github.com/Akshad11/AI-CSV-Importer",
                    "X-Title": process.env.OPENROUTER_TITLE || "AI CSV Importer",
                }
            });
        }
    }

    private getClient(): OpenAI {
        if (!this.client) {
            throw new AIProviderError(
                "OpenRouter API client is not configured. Make sure OPENROUTER_API_KEY environment variable is set.",
                "openrouter",
                "unknown"
            );
        }
        return this.client;
    }

    async generate<T = unknown>(request: AIRequest): Promise<AIResponse<T>> {
        const model = request.model || "openai/gpt-4o";
        const client = this.getClient();

        return this.retryEngine.execute(
            async () => {
                const start = Date.now();
                const options: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
                    model,
                    messages: [
                        { role: "system", content: request.system },
                        { role: "user", content: request.user }
                    ],
                    temperature: request.temperature ?? 0.2,
                    max_completion_tokens: request.maxOutputTokens
                };

                if (request.responseSchema) {
                    const schemaName = request.responseSchemaName || "structured_output";
                    const jsonSchema = zodToJsonSchema(request.responseSchema);

                    options.response_format = {
                        type: "json_schema",
                        json_schema: {
                            name: schemaName,
                            schema: jsonSchema as any,
                            strict: true
                        }
                    };
                }

                try {
                    const completion = await client.chat.completions.create(options);
                    const latency = Date.now() - start;

                    const usage = TokenUsageCalculator.createUsage(
                        model,
                        completion.usage?.prompt_tokens || 0,
                        completion.usage?.completion_tokens || 0,
                        (completion.usage as any)?.prompt_tokens_details?.cached_tokens || 0,
                        (completion.usage as any)?.completion_tokens_details?.reasoning_tokens || 0
                    );

                    const content = completion.choices[0].message.content;
                    if (!content) {
                        throw new Error("Empty response from OpenRouter");
                    }

                    let responseData: any;
                    if (request.responseSchema) {
                        responseData = JSON.parse(content);
                    } else {
                        responseData = content;
                    }

                    return {
                        success: true,
                        provider: "openrouter",
                        model,
                        data: responseData as T,
                        usage,
                        latencyMs: latency
                    };
                } catch (error: any) {
                    this.handleError(error, model);
                }
            },
            "ai",
            undefined,
            `openrouter:generate:${model}`
        );
    }

    async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
        const model = request.model || "openai/gpt-4o";
        const client = this.getClient();

        const stream: any = await this.retryEngine.execute(
            async () => {
                const options: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
                    model,
                    messages: [
                        { role: "system", content: request.system },
                        { role: "user", content: request.user }
                    ],
                    temperature: request.temperature ?? 0.2,
                    max_completion_tokens: request.maxOutputTokens,
                    stream: true,
                    stream_options: { include_usage: true }
                };

                if (request.responseSchema) {
                    const schemaName = request.responseSchemaName || "structured_output";
                    const jsonSchema = zodToJsonSchema(request.responseSchema);
                    options.response_format = {
                        type: "json_schema",
                        json_schema: {
                            name: schemaName,
                            schema: jsonSchema as any,
                            strict: true
                        }
                    };
                }

                try {
                    return await client.chat.completions.create(options);
                } catch (error: any) {
                    this.handleError(error, model);
                }
            },
            "ai",
            undefined,
            `openrouter:stream:${model}`
        );

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            const isLast = chunk.choices[0]?.finish_reason !== null && chunk.choices[0]?.finish_reason !== undefined;

            const usage = chunk.usage
                ? TokenUsageCalculator.createUsage(
                      model,
                      chunk.usage.prompt_tokens,
                      chunk.usage.completion_tokens
                  )
                : undefined;

            yield {
                text,
                usage,
                isLast
            };
        }
    }

    async health(): Promise<AIProviderHealth> {
        if (!process.env.OPENROUTER_API_KEY) {
            return {
                available: false,
                configured: false,
                authenticated: false,
                error: "Missing OPENROUTER_API_KEY environment variable"
            };
        }

        try {
            const start = Date.now();
            const client = this.getClient();

            await client.models.list();

            const latency = Date.now() - start;
            return {
                available: true,
                latencyMs: latency,
                version: "v1",
                model: "openai/gpt-4o",
                configured: true,
                authenticated: true
            };
        } catch (error: any) {
            return {
                available: false,
                configured: true,
                authenticated: false,
                error: error.message
            };
        }
    }

    supportsStructuredOutput(): boolean {
        return true;
    }

    supportsStreaming(): boolean {
        return true;
    }

    async getModelInformation(modelName?: string): Promise<ModelInformation> {
        const name = modelName || "openai/gpt-4o";
        return MODEL_CONFIGS[name] || MODEL_CONFIGS["openai/gpt-4o"];
    }

    private handleError(error: any, model: string): never {
        if (error.status === 429) {
            throw new RateLimitError(
                "OpenRouter Rate limit exceeded: " + error.message,
                "openrouter",
                model,
                error.headers ? parseInt(error.headers["retry-after"] || "60", 10) : 60,
                error
            );
        }
        throw new AIProviderError(
            "OpenRouter provider error: " + error.message,
            "openrouter",
            model,
            error
        );
    }
}
