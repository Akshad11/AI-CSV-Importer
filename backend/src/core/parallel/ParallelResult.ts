export interface ParallelResult<T = any> {
    /**
     * True if the parallel process completed without fatal or unhandled exceptions.
     */
    success: boolean;

    /**
     * Mapped array of execution outputs (ordered or unordered).
     */
    results: T[];

    /**
     * Total number of batches fully executed.
     */
    batchesProcessed: number;

    /**
     * Estimated or counted total rows successfully imported.
     */
    rowsProcessed: number;

    /**
     * Percentage rate of successfully processed batches (0.0 to 1.0).
     */
    successRate: number;

    /**
     * Percentage rate of failed batches.
     */
    failureRate: number;

    /**
     * Average duration in milliseconds taken to execute a batch.
     */
    averageBatchDurationMs: number;

    /**
     * Dynamic throughput in completed batches per second.
     */
    throughputBatchesPerSec: number;

    /**
     * Dynamic throughput in rows processed per second.
     */
    throughputRowsPerSec: number;

    /**
     * Average latency of AI provider completions if applicable.
     */
    averageAiLatencyMs: number;

    /**
     * Average retry attempts triggered across workers.
     */
    averageRetryAttempts: number;

    /**
     * The percentage of worker pool utilization (0.0 to 1.0).
     */
    workerUtilizationPct: number;

    /**
     * Collected errors during parallel batch executions.
     */
    errors: Error[];

    /**
     * Total execution duration in milliseconds.
     */
    executionTimeMs: number;
}
