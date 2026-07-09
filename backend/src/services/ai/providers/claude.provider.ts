import Anthropic from "@anthropic-ai/sdk";
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

export class ClaudeProvider implements IAIProvider {
    private client: Anthropic | null = null;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.client = new Anthropic({ apiKey });
        }
    }

    private getClient(): Anthropic {
        if (!this.client) {
            throw new AIProviderError(
                "Anthropic Claude API client is not configured. Make sure ANTHROPIC_API_KEY environment variable is set.",
                "claude",
                "unknown"
            );
        }
        return this.client;
    }

    async generate<T = unknown>(request: AIRequest): Promise<AIResponse<T>> {
        const model = request.model || "claude-3-5-sonnet";
        const client = this.getClient();
        const start = Date.now();

        try {
            const response = await client.messages.create({
                model,
                max_tokens: request.maxOutputTokens || 4096,
                system: request.system,
                messages: [{ role: "user", content: request.user }],
                temperature: request.temperature ?? 0.2
            });

            const latency = Date.now() - start;

            const usage = TokenUsageCalculator.createUsage(
                model,
                response.usage.input_tokens,
                response.usage.output_tokens
            );

            const contentBlock = response.content[0];
            const contentText = contentBlock.type === "text" ? contentBlock.text : "";

            let responseData: any;
            if (request.responseSchema) {
                responseData = JSON.parse(contentText);
            } else {
                responseData = contentText;
            }

            return {
                success: true,
                provider: "claude",
                model,
                data: responseData as T,
                usage,
                latencyMs: latency
            };
        } catch (error: any) {
            throw new AIProviderError(
                "Anthropic Claude provider error: " + error.message,
                "claude",
                model,
                error
            );
        }
    }

    async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
        const model = request.model || "claude-3-5-sonnet";
        const client = this.getClient();

        try {
            const stream = await client.messages.create({
                model,
                max_tokens: request.maxOutputTokens || 4096,
                system: request.system,
                messages: [{ role: "user", content: request.user }],
                temperature: request.temperature ?? 0.2,
                stream: true
            });

            for await (const event of stream) {
                if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                    yield {
                        text: event.delta.text,
                        isLast: false
                    };
                } else if (event.type === "message_delta") {
                    const usage = event.usage
                        ? TokenUsageCalculator.createUsage(model, 0, event.usage.output_tokens)
                        : undefined;
                    yield {
                        text: "",
                        usage,
                        isLast: false
                    };
                }
            }

            yield {
                text: "",
                isLast: true
            };
        } catch (error: any) {
            throw new AIProviderError(
                "Anthropic Claude streaming error: " + error.message,
                "claude",
                model,
                error
            );
        }
    }

    async health(): Promise<AIProviderHealth> {
        if (!process.env.ANTHROPIC_API_KEY) {
            return {
                available: false,
                configured: false,
                authenticated: false,
                error: "Missing ANTHROPIC_API_KEY environment variable"
            };
        }

        try {
            const start = Date.now();
            const client = this.getClient();

            await client.messages.create({
                model: "claude-3-5-sonnet",
                max_tokens: 1,
                messages: [{ role: "user", content: "ping" }]
            });

            const latency = Date.now() - start;
            return {
                available: true,
                latencyMs: latency,
                version: "v1",
                model: "claude-3-5-sonnet",
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
        return false;
    }

    supportsStreaming(): boolean {
        return true;
    }

    async getModelInformation(modelName?: string): Promise<ModelInformation> {
        const name = modelName || "claude-3-5-sonnet";
        return MODEL_CONFIGS[name] || MODEL_CONFIGS["claude-3-5-sonnet"];
    }
}
