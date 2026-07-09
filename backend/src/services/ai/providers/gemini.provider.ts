import { IAIProvider } from "../ai.provider";
import { AIRequest, AIResponse } from "../ai.types";

export class GeminiProvider implements IAIProvider {
    async generate<T = unknown>(
        _request: AIRequest
    ): Promise<AIResponse<T>> {
        throw new Error(
            "Gemini provider not implemented yet."
        );
    }
}