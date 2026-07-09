import { TokenUsage } from "./ai.types";
import { MODEL_CONFIGS } from "./model.config";

export class TokenUsageCalculator {
    /**
     * Calculates the USD cost based on token counts and model pricing metadata.
     */
    public static calculateCost(
        modelName: string,
        promptTokens: number,
        completionTokens: number
    ): { estimatedCost: number; providerCost: number } {
        const config = MODEL_CONFIGS[modelName] || MODEL_CONFIGS["mock-model"];
        const promptCost = (promptTokens / 1000) * config.costPer1kPrompt;
        const completionCost = (completionTokens / 1000) * config.costPer1kCompletion;
        const total = parseFloat((promptCost + completionCost).toFixed(6));

        return {
            estimatedCost: total,
            providerCost: total
        };
    }

    /**
     * Creates a fully populated TokenUsage structure including costs.
     */
    public static createUsage(
        modelName: string,
        promptTokens: number,
        completionTokens: number,
        cachedTokens = 0,
        reasoningTokens = 0
    ): TokenUsage {
        const { estimatedCost, providerCost } = this.calculateCost(
            modelName,
            promptTokens,
            completionTokens
        );

        return {
            promptTokens,
            completionTokens,
            cachedTokens,
            reasoningTokens,
            totalTokens: promptTokens + completionTokens,
            estimatedCost,
            providerCost
        };
    }
}
