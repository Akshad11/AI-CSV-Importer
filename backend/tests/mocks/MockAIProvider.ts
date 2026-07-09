import { IAIProvider } from "../../src/services/ai/ai.provider";
import {
    AIRequest,
    AIResponse,
    AIStreamChunk,
    AIProviderHealth,
    ModelInformation
} from "../../src/services/ai/ai.types";

export class MockAIProvider implements IAIProvider {
    private forceFailure = false;
    private failureError: Error = new Error("Mock AI Provider failure");
    private latencyMs = 0;

    public setForceFailure(fail: boolean, error?: Error): void {
        this.forceFailure = fail;
        if (error) this.failureError = error;
    }

    public setLatency(latencyMs: number): void {
        this.latencyMs = latencyMs;
    }

    public async generate<T = unknown>(request: AIRequest): Promise<AIResponse<T>> {
        if (this.latencyMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
        }

        if (this.forceFailure) {
            throw this.failureError;
        }

        return {
            success: true,
            provider: "mock",
            model: request.model || "mock-model",
            data: { leads: [{ name: "John Doe", email: "john@example.com" }] } as any,
            usage: {
                promptTokens: 100,
                completionTokens: 50,
                totalTokens: 150
            },
            latencyMs: this.latencyMs
        };
    }

    public async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
        if (this.forceFailure) {
            throw this.failureError;
        }

        yield { text: '{"leads": [', isLast: false };
        yield { text: '{"name": "John Doe", "email": "john@example.com"}', isLast: false };
        yield { text: "]}", isLast: true };
    }

    public async health(): Promise<AIProviderHealth> {
        return {
            available: !this.forceFailure,
            configured: true,
            authenticated: true,
            latencyMs: this.latencyMs
        };
    }

    public supportsStructuredOutput(): boolean {
        return true;
    }

    public supportsStreaming(): boolean {
        return true;
    }

    public async getModelInformation(model?: string): Promise<ModelInformation> {
        return {
            name: model || "mock-model",
            contextWindow: 4096,
            maxOutputTokens: 2048,
            costPer1kPrompt: 0.002,
            costPer1kCompletion: 0.006,
            supportsStructuredOutput: true,
            supportsStreaming: true
        };
    }
}
