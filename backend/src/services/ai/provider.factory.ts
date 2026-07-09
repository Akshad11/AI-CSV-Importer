import { IAIProvider } from "./ai.provider";
import { MockProvider } from "./providers/mock.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { ClaudeProvider } from "./providers/claude.provider";
import { AzureOpenAIProvider } from "./providers/azure.provider";
import { OllamaProvider } from "./providers/ollama.provider";

export type AIProviderType =
    | "mock"
    | "openai"
    | "gemini"
    | "claude"
    | "azure"
    | "ollama";

export class AIProviderFactory {
    /**
     * Instantiates the matching IAIProvider. Useful for raw/manual setup.
     */
    static create(provider: AIProviderType): IAIProvider {
        switch (provider) {
            case "openai":
                return new OpenAIProvider();
            case "gemini":
                return new GeminiProvider();
            case "claude":
                return new ClaudeProvider();
            case "azure":
                return new AzureOpenAIProvider();
            case "ollama":
                return new OllamaProvider();
            case "mock":
            default:
                return new MockProvider();
        }
    }
}