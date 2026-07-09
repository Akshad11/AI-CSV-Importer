export interface RetryStatistics {
    /**
     * Total number of attempts executed.
     */
    attempts: number;

    /**
     * True if the final execution was successful.
     */
    succeeded: boolean;

    /**
     * True if the execution failed and exhausted retries.
     */
    failed: boolean;

    /**
     * True if the execution was cancelled before completion.
     */
    cancelled: boolean;

    /**
     * Cumulative delay in milliseconds introduced by backoffs.
     */
    totalDelayMs: number;

    /**
     * Total execution duration in milliseconds (active run + backoffs).
     */
    executionTimeMs: number;

    /**
     * Average time taken in milliseconds for active attempts (excluding delay).
     */
    averageAttemptTimeMs: number;

    /**
     * Cumulative sleep/backoff time in milliseconds.
     */
    backoffTimeMs: number;

    /**
     * The last encountered error (if any).
     */
    lastError: Error | null;
}

export function createEmptyStatistics(): RetryStatistics {
    return {
        attempts: 0,
        succeeded: false,
        failed: false,
        cancelled: false,
        totalDelayMs: 0,
        executionTimeMs: 0,
        averageAttemptTimeMs: 0,
        backoffTimeMs: 0,
        lastError: null
    };
}
