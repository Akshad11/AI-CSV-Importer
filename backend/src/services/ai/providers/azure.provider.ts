import { AzureOpenAI } from "openai";
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

export class AzureOpenAIProvider implements IAIProvider {
    private client: AzureOpenAI | null = null;
    private deploymentName: string;

    constructor() {
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const apiKey = process.env.AZURE_OPENAI_KEY;
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-05-01-preview";
        this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

        if (endpoint) {
            if (apiKey) {
                this.client = new AzureOpenAI({
                    endpoint,
                    apiKey,
                    apiVersion
                });
            } else {
                // Managed Identity Dynamic Import Support (to prevent compilation failures if @azure/identity is not installed)
                try {
                    const { DefaultAzureCredential } = require("@azure/identity");
                    const { getBearerTokenProvider } = require("@azure/identity");
                    
                    const credential = new DefaultAzureCredential();
                    const scope = "https://cognitiveservices.azure.com/.default";
                    const azureADTokenProvider = getBearerTokenProvider(credential, scope);
                    
                    this.client = new AzureOpenAI({
                        endpoint,
                        azureADTokenProvider,
                        apiVersion
                    });
                } catch (e) {
                    // Fallback or log if managed identity loading is unavailable
                }
            }
        }
    }

    private getClient(): AzureOpenAI {
        if (!this.client) {
            throw new AIProviderError(
                "Azure OpenAI client is not configured. Make sure AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY (or Managed Identity credentials) are set.",
                "azure",
                this.deploymentName
            );
        }
        return this.client;
    }

    async generate<T = unknown>(request: AIRequest): Promise<AIResponse<T>> {
        const client = this.getClient();
        const start = Date.now();

        try {
            const options: any = {
                model: this.deploymentName,
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

            const completion = await client.chat.completions.create(options);
            const latency = Date.now() - start;

            const usage = TokenUsageCalculator.createUsage(
                "gpt-4o",
                completion.usage?.prompt_tokens || 0,
                completion.usage?.completion_tokens || 0
            );

            const content = completion.choices[0].message.content;
            if (!content) {
                throw new Error("Empty response from Azure OpenAI");
            }

            let responseData: any;
            if (request.responseSchema) {
                responseData = JSON.parse(content);
            } else {
                responseData = content;
            }

            return {
                success: true,
                provider: "azure",
                model: this.deploymentName,
                data: responseData as T,
                usage,
                latencyMs: latency
            };
        } catch (error: any) {
            this.handleError(error, this.deploymentName);
        }
    }

    async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
        const client = this.getClient();

        try {
            const options: any = {
                model: this.deploymentName,
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

            const stream: any = await client.chat.completions.create(options);

            for await (const chunk of stream) {
                const text = chunk.choices[0]?.delta?.content || "";
                const isLast = chunk.choices[0]?.finish_reason !== null && chunk.choices[0]?.finish_reason !== undefined;

                const usage = chunk.usage
                    ? TokenUsageCalculator.createUsage(
                          "gpt-4o",
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
        } catch (error: any) {
            this.handleError(error, this.deploymentName);
        }
    }

    async health(): Promise<AIProviderHealth> {
        if (!process.env.AZURE_OPENAI_ENDPOINT) {
            return {
                available: false,
                configured: false,
                authenticated: false,
                error: "Missing AZURE_OPENAI_ENDPOINT environment variable"
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
                model: this.deploymentName,
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
        return MODEL_CONFIGS["gpt-4o"];
    }

    private handleError(error: any, model: string): never {
        if (error.status === 429) {
            throw new RateLimitError(
                "Azure OpenAI Rate limit exceeded: " + error.message,
                "azure",
                model,
                error.headers ? parseInt(error.headers["retry-after"] || "60", 10) : 60,
                error
            );
        }
        throw new AIProviderError(
            "Azure OpenAI provider error: " + error.message,
            "azure",
            model,
            error
        );
    }
}
