import { CostCalculationError } from "./MetricsErrors";

export interface ModelPricing {
    promptCostPer1k: number;
    completionCostPer1k: number;
}

export class CostCalculator {
    private readonly pricingMap: Map<string, ModelPricing> = new Map();

    constructor() {
        this.initializePricing();
    }

    private initializePricing(): void {
        this.pricingMap.set("gpt-4o", { promptCostPer1k: 0.005, completionCostPer1k: 0.015 });
        this.pricingMap.set("gpt-3.5-turbo", { promptCostPer1k: 0.0005, completionCostPer1k: 0.0015 });
        this.pricingMap.set("gemini-1.5-pro", { promptCostPer1k: 0.00125, completionCostPer1k: 0.00375 });
        this.pricingMap.set("gemini-1.5-flash", { promptCostPer1k: 0.000075, completionCostPer1k: 0.0003 });
    }

    /**
     * Calculates the execution cost based on prompt and completion token counts.
     */
    public calculateCost(model: string, promptTokens: number, completionTokens: number): number {
        try {
            const normalizedModel = model.toLowerCase();
            const pricing = this.pricingMap.get(normalizedModel) || {
                promptCostPer1k: 0.002, // Default fallback model prompt pricing
                completionCostPer1k: 0.006 // Default fallback model completion pricing
            };

            const promptCost = (promptTokens / 1000) * pricing.promptCostPer1k;
            const completionCost = (completionTokens / 1000) * pricing.completionCostPer1k;

            return parseFloat((promptCost + completionCost).toFixed(6));
        } catch (e: any) {
            throw new CostCalculationError(`Failed to calculate model costs: ${e.message}`, e);
        }
    }

    /**
     * Estimates potential savings compared against a baseline model (e.g. comparing gpt-4o with gemini-1.5-flash).
     */
    public calculateEstimatedSavings(
        activeModel: string,
        baselineModel: string,
        promptTokens: number,
        completionTokens: number
    ): number {
        const activeCost = this.calculateCost(activeModel, promptTokens, completionTokens);
        const baselineCost = this.calculateCost(baselineModel, promptTokens, completionTokens);
        return parseFloat(Math.max(0, baselineCost - activeCost).toFixed(6));
    }

    public projectMonthlyCost(totalCost: number, durationMs: number): number {
        if (durationMs <= 0) return 0;
        // Project cost based on average hourly run rates (running 24/7 hypothetical rate limit)
        const runRatePerMs = totalCost / durationMs;
        const msInMonth = 30 * 24 * 60 * 60 * 1000;
        return parseFloat((runRatePerMs * msInMonth).toFixed(2));
    }
}
