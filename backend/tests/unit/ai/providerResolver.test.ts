import { describe, expect, it } from "vitest";
import { Container } from "../../../src/container/container";
import { AIProviderResolver } from "../../../src/services/ai/AIProviderResolver";
import { IAIProvider } from "../../../src/services/ai/ai.provider";
import { AIConfig } from "../../../src/config/ai.config";

describe("AI Provider Resolver", () => {
    class MockAIProvider implements IAIProvider {
        async generate<T = unknown>(): Promise<any> {
            return { success: true, provider: "mock", model: "test", data: {} as T };
        }
    }

    class OpenAIProvider implements IAIProvider {
        async generate<T = unknown>(): Promise<any> {
            return { success: true, provider: "openai", model: "test", data: {} as T };
        }
    }

    it("resolves registered provider by configuration default", () => {
        const container = new Container();
        const config: AIConfig = {
            provider: "openai",
            model: "gpt-4",
            batchSize: 10,
            temperature: 0.5,
            maxOutputTokens: 1000,
        };

        container.registerSingleton("OpenAIProvider", OpenAIProvider);
        container.registerSingleton("container", container);
        container.registerSingleton("config", config);
        container.registerSingleton("resolver", AIProviderResolver);

        const resolver = container.resolve<AIProviderResolver>("resolver");
        const provider = resolver.resolve();

        expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it("resolves specific provider when override is passed", () => {
        const container = new Container();
        const config: AIConfig = {
            provider: "openai",
            model: "gpt-4",
            batchSize: 10,
            temperature: 0.5,
            maxOutputTokens: 1000,
        };

        container.registerSingleton("OpenAIProvider", OpenAIProvider);
        container.registerSingleton("MockProvider", MockAIProvider);
        container.registerSingleton("container", container);
        container.registerSingleton("config", config);
        container.registerSingleton("resolver", AIProviderResolver);

        const resolver = container.resolve<AIProviderResolver>("resolver");
        const provider = resolver.resolve("mock");

        expect(provider).toBeInstanceOf(MockAIProvider);
    });

    it("throws descriptive error for unsupported providers", () => {
        const container = new Container();
        const config: AIConfig = {
            provider: "unsupported-provider",
            model: "gpt-4",
            batchSize: 10,
            temperature: 0.5,
            maxOutputTokens: 1000,
        };

        container.registerSingleton("container", container);
        container.registerSingleton("config", config);
        container.registerSingleton("resolver", AIProviderResolver);

        const resolver = container.resolve<AIProviderResolver>("resolver");

        expect(() => resolver.resolve()).toThrow(
            "Unsupported AI provider type requested: [unsupported-provider]"
        );
    });

    it("throws clear error when a provider is not registered in the DI Container", () => {
        const container = new Container();
        const config: AIConfig = {
            provider: "gemini",
            model: "gemini-pro",
            batchSize: 10,
            temperature: 0.5,
            maxOutputTokens: 1000,
        };

        container.registerSingleton("container", container);
        container.registerSingleton("config", config);
        container.registerSingleton("resolver", AIProviderResolver);

        const resolver = container.resolve<AIProviderResolver>("resolver");

        expect(() => resolver.resolve()).toThrow(
            "Failed to resolve AI provider [gemini] (DI token: [GeminiProvider])."
        );
    });
});
