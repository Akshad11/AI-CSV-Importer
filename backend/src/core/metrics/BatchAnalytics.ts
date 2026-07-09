import { BatchMetrics } from "./MetricsTypes";

export class BatchAnalytics {
    private readonly batches: BatchMetrics[] = [];

    /**
     * Records telemetry metrics for an executed batch.
     */
    public recordBatch(metrics: BatchMetrics): void {
        this.batches.push(metrics);
    }

    public getBatchSummary() {
        const totalBatches = this.batches.length;
        if (totalBatches === 0) {
            return {
                averageRows: 0,
                largestBatch: 0,
                smallestBatch: 0,
                averageDuration: 0,
                successRate: 1.0,
                averageQueueDelay: 0,
                averageProcessingDelay: 0
            };
        }

        let totalRows = 0;
        let largestBatch = 0;
        let smallestBatch = Infinity;
        let totalDuration = 0;
        let successCount = 0;
        let totalQueueDelay = 0;
        let totalProcessingDelay = 0;

        for (const b of this.batches) {
            totalRows += b.batchSize;
            largestBatch = Math.max(largestBatch, b.batchSize);
            smallestBatch = Math.min(smallestBatch, b.batchSize);
            totalDuration += b.durationMs;
            totalQueueDelay += b.queueDelayMs;
            totalProcessingDelay += b.processingDelayMs;
            if (b.success) {
                successCount++;
            }
        }

        return {
            averageRows: parseFloat((totalRows / totalBatches).toFixed(2)),
            largestBatch,
            smallestBatch: smallestBatch === Infinity ? 0 : smallestBatch,
            averageDuration: parseFloat((totalDuration / totalBatches).toFixed(2)),
            successRate: successCount / totalBatches,
            averageQueueDelay: parseFloat((totalQueueDelay / totalBatches).toFixed(2)),
            averageProcessingDelay: parseFloat((totalProcessingDelay / totalBatches).toFixed(2))
        };
    }

    public getBatches(): BatchMetrics[] {
        return this.batches;
    }
}
