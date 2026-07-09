import { IAIProvider } from "../ai.provider";
import { AIRequest, AIResponse } from "../ai.types";

export class MockProvider implements IAIProvider {
    async generate<T = unknown>(
        request: AIRequest
    ): Promise<AIResponse<T>> {
        return {
            success: true,

            provider: "mock",

            model: "mock-model",

            data: {
                system: request.system,
                user: request.user
            } as T
        };
    }
}