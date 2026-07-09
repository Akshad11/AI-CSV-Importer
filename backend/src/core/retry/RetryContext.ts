export interface RetryContext {
    /**
     * The current attempt index (1-indexed).
     */
    attempt: number;

    /**
     * Epoch timestamp in milliseconds indicating when the operation started.
     */
    startTime: number;

    /**
     * Time elapsed in milliseconds since execution started.
     */
    elapsedTime: number;

    /**
     * The last error encountered.
     */
    lastError?: Error;

    /**
     * The delay in milliseconds applied for the previous retry step.
     */
    previousDelayMs?: number;
}
