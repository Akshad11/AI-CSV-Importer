import { PerformanceMetrics } from "./MetricsTypes";
import { ResourceMonitor } from "../parallel/ResourceMonitor";

export class PerformanceCollector {
    private readonly resourceMonitor = new ResourceMonitor();

    /**
     * Collects and calculates system and throughput execution metrics.
     */
    public collect(
        rowsCount: number,
        batchesCount: number,
        tokensCount: number,
        durationMs: number,
        workerPoolUtilization = 0,
        queueUtilization = 0,
        latenciesMs: number[] = []
    ): Partial<PerformanceMetrics> {
        const memory = this.resourceMonitor.getMemoryUsageInfo();

        const seconds = Math.max(0.001, durationMs / 1000);
        const rowsPerSecond = parseFloat((rowsCount / seconds).toFixed(2));
        const batchesPerSecond = parseFloat((batchesCount / seconds).toFixed(2));
        const tokensPerSecond = parseFloat((tokensCount / seconds).toFixed(2));

        const sorted = [...latenciesMs].sort((a, b) => a - b);
        const len = sorted.length;
        const getP = (pct: number) => (len > 0 ? sorted[Math.min(Math.floor(len * pct), len - 1)] : 0);

        return {
            rowsPerSecond,
            batchesPerSecond,
            tokensPerSecond,
            averageThroughput: rowsPerSecond,
            peakThroughput: rowsPerSecond,
            workerUtilization: workerPoolUtilization,
            queueUtilization,
            memoryUsedBytes: memory.heapUsed,
            memoryLimitBytes: memory.heapTotal,
            cpuPercentage: 0,
            executionTimeMs: durationMs,
            p50: getP(0.5),
            p90: getP(0.9),
            p95: getP(0.95),
            p99: getP(0.99)
        };
    }
}
