import { AIRequest, AIResponse } from "./ai.types";

export interface IAIProvider {
    generate<T = unknown>(
        request: AIRequest
    ): Promise<AIResponse<T>>;
}