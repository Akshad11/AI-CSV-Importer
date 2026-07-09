import { AIResponse, TokenUsage } from "../../src/services/ai/ai.types";

export class AIResponseBuilder<T = any> {
    private readonly response: AIResponse<T> = {
        success: true,
        provider: "mock",
        model: "mock-model",
        data: {} as T,
        usage: {
            promptTokens: 100,
            completionTokens: 50,
            totalTokens: 150
        },
        latencyMs: 120
    };

    public withSuccess(success: boolean): this {
        this.response.success = success;
        return this;
    }

    public withProvider(provider: string): this {
        this.response.provider = provider;
        return this;
    }

    public withModel(model: string): this {
        this.response.model = model;
        return this;
    }

    public withData(data: T): this {
        this.response.data = data;
        return this;
    }

    public withUsage(usage: TokenUsage): this {
        this.response.usage = usage;
        return this;
    }

    public build(): AIResponse<T> {
        return { ...this.response };
    }
}
