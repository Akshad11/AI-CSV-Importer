import { IAIProvider } from "./ai.provider";
import { MockProvider } from "./providers/mock.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import { GeminiProvider } from "./providers/gemini.provider";

export type AIProviderType =
    | "mock"
    | "openai"
    | "gemini";

export class AIProviderFactory {
    static create(
        provider: AIProviderType
    ): IAIProvider {
        switch (provider) {
            case "openai":
                return new OpenAIProvider();

            case "gemini":
                return new GeminiProvider();

            default:
                return new MockProvider();
        }
    }
}