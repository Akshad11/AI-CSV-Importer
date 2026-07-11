import { GoogleGenerativeAI } from "@google/generative-ai";
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

export class GeminiProvider implements IAIProvider {
    public static inject = ["retryEngine"];

    private genAI: GoogleGenerativeAI | null = null;
    private readonly retryEngine: RetryEngine;

    constructor(retryEngine?: RetryEngine) {
        this.retryEngine = retryEngine || new RetryEngine();
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    private getGenAI(): GoogleGenerativeAI {
        if (!this.genAI) {
            throw new AIProviderError(
                "Gemini API client is not configured. Make sure GEMINI_API_KEY environment variable is set.",
                "gemini",
                "unknown"
            );
        }
        return this.genAI;
    }

    async generate<T = unknown>(request: AIRequest): Promise<AIResponse<T>> {
        const modelName = request.model || "gemini-1.5-flash";
        const genAI = this.getGenAI();

        return this.retryEngine.execute(
            async () => {
                const start = Date.now();
                const generationConfig: any = {
                    temperature: request.temperature ?? 0.2,
                    maxOutputTokens: request.maxOutputTokens
                };

                if (request.responseSchema) {
                    generationConfig.responseMimeType = "application/json";
                    const jsonSchema = zodToJsonSchema(request.responseSchema);
                    generationConfig.responseSchema = this.convertSchema(jsonSchema);
                }

                const model = genAI.getGenerativeModel({ model: modelName, generationConfig });

                try {
                    const result = await model.generateContent({
                        contents: [{ role: "user", parts: [{ text: request.user }] }],
                        systemInstruction: request.system
                    });

                    const latency = Date.now() - start;

                    const metadata = result.response.usageMetadata;
                    const promptTokens = metadata?.promptTokenCount || 0;
                    const completionTokens = metadata?.candidatesTokenCount || 0;

                    const usage = TokenUsageCalculator.createUsage(
                        modelName,
                        promptTokens,
                        completionTokens
                    );

                    const content = result.response.text();
                    if (!content) {
                        throw new Error("Empty response from Gemini");
                    }

                    let responseData: any;
                    if (request.responseSchema) {
                        responseData = JSON.parse(content);
                    } else {
                        responseData = content;
                    }

                    return {
                        success: true,
                        provider: "gemini",
                        model: modelName,
                        data: responseData as T,
                        usage,
                        latencyMs: latency
                    };
                } catch (error: any) {
                    this.handleError(error, modelName);
                }
            },
            "ai",
            undefined,
            `gemini:generate:${modelName}`
        );
    }

    async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
        const modelName = request.model || "gemini-1.5-flash";
        const genAI = this.getGenAI();

        const resultStream: any = await this.retryEngine.execute(
            async () => {
                const generationConfig: any = {
                    temperature: request.temperature ?? 0.2,
                    maxOutputTokens: request.maxOutputTokens
                };

                if (request.responseSchema) {
                    generationConfig.responseMimeType = "application/json";
                    const jsonSchema = zodToJsonSchema(request.responseSchema);
                    generationConfig.responseSchema = this.convertSchema(jsonSchema);
                }

                const model = genAI.getGenerativeModel({ model: modelName, generationConfig });

                try {
                    return await model.generateContentStream({
                        contents: [{ role: "user", parts: [{ text: request.user }] }],
                        systemInstruction: request.system
                    });
                } catch (error: any) {
                    this.handleError(error, modelName);
                }
            },
            "ai",
            undefined,
            `gemini:stream:${modelName}`
        );

        for await (const chunk of resultStream.stream) {
            const text = chunk.text();
            const metadata = chunk.usageMetadata;
            const usage = metadata
                ? TokenUsageCalculator.createUsage(
                      modelName,
                      metadata.promptTokenCount,
                      metadata.candidatesTokenCount
                  )
                : undefined;

            yield {
                text,
                usage,
                isLast: false
            };
        }
    }

    async health(): Promise<AIProviderHealth> {
        if (!process.env.GEMINI_API_KEY) {
            return {
                available: false,
                configured: false,
                authenticated: false,
                error: "Missing GEMINI_API_KEY environment variable"
            };
        }

        try {
            const start = Date.now();
            const genAI = this.getGenAI();

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            await model.countTokens("ping");

            const latency = Date.now() - start;
            return {
                available: true,
                latencyMs: latency,
                version: "v1",
                model: "gemini-1.5-flash",
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
        const name = modelName || "gemini-1.5-flash";
        return MODEL_CONFIGS[name] || MODEL_CONFIGS["gemini-1.5-flash"];
    }

    private convertSchema(jsonSchema: any): any {
        if (!jsonSchema) return undefined;

        const googleSchema: any = {};

        if (jsonSchema.type) {
            if (Array.isArray(jsonSchema.type)) {
                const types = jsonSchema.type.filter((t: string) => t !== "null");
                googleSchema.type = types[0].toUpperCase();
                googleSchema.nullable = jsonSchema.type.includes("null");
            } else {
                googleSchema.type = jsonSchema.type.toUpperCase();
            }
        }

        if (jsonSchema.properties) {
            googleSchema.properties = {};
            for (const [key, prop] of Object.entries(jsonSchema.properties)) {
                googleSchema.properties[key] = this.convertSchema(prop);
            }
        }

        if (jsonSchema.required) {
            googleSchema.required = jsonSchema.required;
        }

        if (jsonSchema.items) {
            googleSchema.items = this.convertSchema(jsonSchema.items);
        }

        if (jsonSchema.description) {
            googleSchema.description = jsonSchema.description;
        }

        return googleSchema;
    }

    private handleError(error: any, model: string): never {
        const msg = String(error.message || "").toLowerCase();

        if (
            error.status === 429 ||
            msg.includes("quota exceeded") ||
            msg.includes("rate limit") ||
            msg.includes("429")
        ) {
            throw new RateLimitError(
                "Gemini Rate limit exceeded: " + error.message,
                "gemini",
                model,
                60,
                error
            );
        }
        throw new AIProviderError(
            "Gemini provider error: " + error.message,
            "gemini",
            model,
            error
        );
    }
}