import { Container } from "../../container/container";
import { IAIProvider } from "./ai.provider";
import { AIConfig } from "../../config/ai.config";
import { AIProviderType } from "./provider.factory";
import { IAIProviderResolver } from "../../core/interfaces/IAIProviderResolver";

export class AIProviderResolver implements IAIProviderResolver {
    public static inject = ["container", "config"];

    private readonly tokenMap: Record<string, string> = {
        openai: "OpenAIProvider",
        gemini: "GeminiProvider",
        mock: "MockProvider",
        claude: "ClaudeProvider",
        azure: "AzureOpenAIProvider",
        ollama: "OllamaProvider",
        openrouter: "OpenRouterProvider"
    };

    constructor(
        private readonly container: Container,
        private readonly config: AIConfig
    ) {}

    /**
     * Resolves the required IAIProvider instance based on config or custom override.
     */
    public resolve(providerType?: AIProviderType): IAIProvider {
        const type = providerType || (this.config.provider as AIProviderType);
        const token = this.tokenMap[type];

        if (!token) {
            throw new Error(`Unsupported AI provider type requested: [${type}]`);
        }

        try {
            return this.container.resolve<IAIProvider>(token);
        } catch (error) {
            throw new Error(
                `Failed to resolve AI provider [${type}] (DI token: [${token}]). Make sure it is registered in the DI Container. Original error: ${(error as Error).message}`
            );
        }
    }
}
export { AIProviderResolver as ProviderResolver };
