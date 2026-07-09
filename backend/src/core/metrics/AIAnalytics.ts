import { CostCalculator } from "./CostCalculator";

export interface AICallLog {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    cachedTokens?: number;
    reasoningTokens?: number;
    promptSizeBytes?: number;
    responseSizeBytes?: number;
    latencyMs: number;
    success: boolean;
    timeout?: boolean;
    retries?: number;
}

export class AIAnalytics {
    private readonly logs: AICallLog[] = [];
    private readonly costCalculator = new CostCalculator();

    /**
     * Records telemetry metrics for an AI provider completion API call.
     */
    public recordCall(log: AICallLog): void {
        this.logs.push(log);
    }

    public getAISummary() {
        const totalCalls = this.logs.length;
        if (totalCalls === 0) {
            return {
                totalTokens: 0,
                promptTokens: 0,
                completionTokens: 0,
                cachedTokens: 0,
                reasoningTokens: 0,
                callsCount: 0,
                averageLatencyMs: 0,
                fastestLatencyMs: 0,
                slowestLatencyMs: 0,
                retries: 0,
                failures: 0,
                timeouts: 0,
                totalCost: 0,
                byModel: {} as Record<string, { calls: number; tokens: number; cost: number }>
            };
        }

        let totalTokens = 0;
        let promptTokens = 0;
        let completionTokens = 0;
        let cachedTokens = 0;
        let reasoningTokens = 0;
        let totalLatency = 0;
        let fastestLatency = Infinity;
        let slowestLatency = 0;
        let retries = 0;
        let failures = 0;
        let timeouts = 0;
        let totalCost = 0;

        const byModel: Record<string, { calls: number; tokens: number; cost: number }> = {};

        for (const log of this.logs) {
            const prompt = log.promptTokens;
            const completion = log.completionTokens;
            const cached = log.cachedTokens || 0;
            const reasoning = log.reasoningTokens || 0;
            const total = prompt + completion;

            promptTokens += prompt;
            completionTokens += completion;
            cachedTokens += cached;
            reasoningTokens += reasoning;
            totalTokens += total;

            totalLatency += log.latencyMs;
            fastestLatency = Math.min(fastestLatency, log.latencyMs);
            slowestLatency = Math.max(slowestLatency, log.latencyMs);

            retries += log.retries || 0;
            if (!log.success) {
                failures++;
            }
            if (log.timeout) {
                timeouts++;
            }

            const cost = this.costCalculator.calculateCost(log.model, prompt, completion);
            totalCost += cost;

            if (!byModel[log.model]) {
                byModel[log.model] = { calls: 0, tokens: 0, cost: 0 };
            }
            byModel[log.model].calls++;
            byModel[log.model].tokens += total;
            byModel[log.model].cost = parseFloat((byModel[log.model].cost + cost).toFixed(6));
        }

        return {
            totalTokens,
            promptTokens,
            completionTokens,
            cachedTokens,
            reasoningTokens,
            callsCount: totalCalls,
            averageLatencyMs: parseFloat((totalLatency / totalCalls).toFixed(2)),
            fastestLatencyMs: fastestLatency === Infinity ? 0 : fastestLatency,
            slowestLatencyMs: slowestLatency,
            retries,
            failures,
            timeouts,
            totalCost: parseFloat(totalCost.toFixed(6)),
            byModel
        };
    }

    public getLogs(): AICallLog[] {
        return this.logs;
    }
}
