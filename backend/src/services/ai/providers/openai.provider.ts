import { IAIProvider } from "../ai.provider";
import { AIRequest, AIResponse } from "../ai.types";

export class OpenAIProvider implements IAIProvider {
    async generate<T = unknown>(
        _request: AIRequest
    ): Promise<AIResponse<T>> {
        throw new Error(
            "OpenAI provider not implemented yet."
        );
    }
}