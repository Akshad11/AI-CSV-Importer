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

export class MockProvider implements IAIProvider {
    public latencyMs = 10;
    public availability = true;
    public configureStatus = true;
    public authStatus = true;

    async generate<T = unknown>(request: AIRequest): Promise<AIResponse<T>> {
        const model = request.model || "mock-model";
        const start = Date.now();

        await new Promise((resolve) => setTimeout(resolve, this.latencyMs));

        let responseData: any;
        if (request.responseSchema) {
            responseData = [
                {
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                    company: "Acme",
                    phone: "12345",
                    title: "Manager"
                }
            ];
        } else {
            responseData = `Hello from Mock Provider! Model: ${model}`;
        }

        const usage = TokenUsageCalculator.createUsage(model, 15, 25);
        const latency = Date.now() - start;

        return {
            success: true,
            provider: "mock",
            model,
            data: responseData as T,
            usage,
            latencyMs: latency
        };
    }

    async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
        const model = request.model || "mock-model";
        const chunks = ["Hello ", "from ", "mock ", "stream!"];

        for (let i = 0; i < chunks.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, this.latencyMs));

            const isLast = i === chunks.length - 1;
            const usage = isLast ? TokenUsageCalculator.createUsage(model, 15, 25) : undefined;

            yield {
                text: chunks[i],
                usage,
                isLast
            };
        }
    }

    async health(): Promise<AIProviderHealth> {
        return {
            available: this.availability,
            latencyMs: this.latencyMs,
            version: "1.0.0",
            model: "mock-model",
            configured: this.configureStatus,
            authenticated: this.authStatus
        };
    }

    supportsStructuredOutput(): boolean {
        return true;
    }

    supportsStreaming(): boolean {
        return true;
    }

    async getModelInformation(modelName?: string): Promise<ModelInformation> {
        const name = modelName || "mock-model";
        return MODEL_CONFIGS[name] || MODEL_CONFIGS["mock-model"];
    }
}