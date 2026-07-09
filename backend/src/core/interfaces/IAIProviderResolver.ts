import { IAIProvider } from "../../services/ai/ai.provider";
import { AIProviderType } from "../../services/ai/provider.factory";

export interface IAIProviderResolver {
    resolve(providerType?: AIProviderType): IAIProvider;
}
