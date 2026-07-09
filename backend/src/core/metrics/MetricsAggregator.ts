import { HistoricalSnapshot } from "./Snapshot";

export class MetricsAggregator {
    /**
     * Aggregates a series of historical snapshots into dynamic trends and distributions.
     */
    public aggregateSnapshots(snapshots: HistoricalSnapshot[]) {
        const count = snapshots.length;
        if (count === 0) {
            return {
                totalRuns: 0,
                successRate: 1.0,
                cumulativeCost: 0,
                cumulativeTokens: 0,
                averageDurationMs: 0,
                averageThroughput: 0,
                averageLatencyMs: 0,
                totalErrors: 0,
                byProvider: {} as Record<string, { runs: number; cost: number; tokens: number }>
            };
        }

        let successCount = 0;
        let cumulativeCost = 0;
        let cumulativeTokens = 0;
        let totalDuration = 0;
        let totalThroughput = 0;
        let totalLatency = 0;
        let totalErrors = 0;

        const byProvider: Record<string, { runs: number; cost: number; tokens: number }> = {};

        for (const s of snapshots) {
            if (s.success) {
                successCount++;
            }
            cumulativeCost += s.totalCost;
            cumulativeTokens += s.tokensTotal;
            totalDuration += s.durationMs;
            totalThroughput += s.throughputRowsPerSec;
            totalLatency += s.averageLatencyMs;
            totalErrors += s.errorsCount;

            const providerKey = s.provider || "unknown";
            if (!byProvider[providerKey]) {
                byProvider[providerKey] = { runs: 0, cost: 0, tokens: 0 };
            }
            byProvider[providerKey].runs++;
            byProvider[providerKey].cost = parseFloat((byProvider[providerKey].cost + s.totalCost).toFixed(6));
            byProvider[providerKey].tokens += s.tokensTotal;
        }

        return {
            totalRuns: count,
            successRate: successCount / count,
            cumulativeCost: parseFloat(cumulativeCost.toFixed(6)),
            cumulativeTokens,
            averageDurationMs: parseFloat((totalDuration / count).toFixed(2)),
            averageThroughput: parseFloat((totalThroughput / count).toFixed(2)),
            averageLatencyMs: parseFloat((totalLatency / count).toFixed(2)),
            totalErrors,
            byProvider
        };
    }
}
