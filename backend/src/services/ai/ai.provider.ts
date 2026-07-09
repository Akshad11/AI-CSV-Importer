import {
    AIRequest,
    AIResponse,
    AIStreamChunk,
    AIProviderHealth,
    ModelInformation
} from "./ai.types";

export interface IAIProvider {
    generate<T = unknown>(request: AIRequest): Promise<AIResponse<T>>;
    
    stream(request: AIRequest): AsyncIterable<AIStreamChunk>;
    
    health(): Promise<AIProviderHealth>;
    
    supportsStructuredOutput(): boolean;
    
    supportsStreaming(): boolean;
    
    getModelInformation(model?: string): Promise<ModelInformation>;
}