export type JitterStrategy = "none" | "full" | "equal" | "decorrelated";
export type DelayStrategyType = "constant" | "linear" | "exponential" | "custom";

export interface RetryOptions {
    /**
     * Maximum number of attempts to try before failing.
     */
    maxAttempts: number;

    /**
     * Initial delay in milliseconds for the first retry.
     */
    initialDelayMs: number;

    /**
     * Maximum delay boundary in milliseconds.
     */
    maxDelayMs: number;

    /**
     * Multiplier factor for backoff progression.
     */
    multiplier: number;

    /**
     * The jitter mode to apply (none, full, equal, decorrelated).
     */
    jitter: JitterStrategy;

    /**
     * The base progression pattern (constant, linear, exponential, custom).
     */
    delayStrategy: DelayStrategyType;

    /**
     * Maximum cumulative execution timeout in milliseconds for the whole retry execution.
     */
    timeoutMs?: number;

    /**
     * Timeout boundary in milliseconds for an individual attempt.
     */
    attemptTimeoutMs?: number;

    /**
     * Optional custom function checking if the error is retryable.
     */
    retryPredicate?: (error: Error) => boolean;

    /**
     * Optional custom function checking if the result value denotes success.
     * If false, will treat as retryable failure.
     */
    successPredicate?: (result: any) => boolean;

    /**
     * Optional custom delay provider if delayStrategy is set to "custom".
     */
    customDelayCalculator?: (attempt: number, error?: Error) => number;
}
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxAttempts: 3,
    initialDelayMs: 500,
    maxDelayMs: 30000,
    multiplier: 2,
    jitter: "decorrelated",
    delayStrategy: "exponential"
};
