export interface HistoricalSnapshot {
    importId: string;
    timestamp: Date;
    durationMs: number;
    success: boolean;
    provider: string;
    model: string;
    rowsTotal: number;
    rowsSuccessful: number;
    rowsFailed: number;
    tokensTotal: number;
    totalCost: number;
    averageLatencyMs: number;
    p99LatencyMs: number;
    errorsCount: number;
    throughputRowsPerSec: number;
}

export function createSnapshotFromCollector(
    importId: string,
    success: boolean,
    durationMs: number,
    provider: string,
    model: string,
    collector: any
): HistoricalSnapshot {
    const rows = collector.statsCollector.getRowStatistics();
    const ai = collector.aiAnalytics.getAISummary();
    const perf = collector.collectPerformance();
    const errors = collector.errorAnalytics.getErrorSummary();

    return {
        importId,
        timestamp: new Date(),
        durationMs,
        success,
        provider,
        model,
        rowsTotal: rows.total,
        rowsSuccessful: rows.successful,
        rowsFailed: rows.failed,
        tokensTotal: ai.totalTokens,
        totalCost: ai.totalCost,
        averageLatencyMs: ai.averageLatencyMs,
        p99LatencyMs: perf.p99,
        errorsCount: errors.profiles.reduce((acc: number, cur: any) => acc + cur.frequency, 0),
        throughputRowsPerSec: perf.rowsPerSecond
    };
}
