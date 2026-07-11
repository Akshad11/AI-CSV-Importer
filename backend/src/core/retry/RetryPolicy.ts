import { RetryOptions } from "./RetryOptions";

export class RetryPolicy {
    /**
     * Resilient policy for AI provider operations (e.g., GPT/Gemini API).
     */
    public static aiProvider(custom: Partial<RetryOptions> = {}): RetryOptions {
        return {
            maxAttempts: 3,
            initialDelayMs: 1000,
            maxDelayMs: 15000,
            multiplier: 2,
            jitter: "decorrelated",
            delayStrategy: "exponential",
            timeoutMs: 600000, // 10 minutes overall timeout
            attemptTimeoutMs: 300000, // 5 minutes attempt timeout
            ...custom
        };
    }

    /**
     * Resilience policy for general HTTP API client operations.
     */
    public static http(custom: Partial<RetryOptions> = {}): RetryOptions {
        return {
            maxAttempts: 4,
            initialDelayMs: 500,
            maxDelayMs: 10000,
            multiplier: 2,
            jitter: "full",
            delayStrategy: "exponential",
            timeoutMs: 30000,
            attemptTimeoutMs: 10000,
            ...custom
        };
    }

    /**
     * Resilient policy for database operations (e.g., PostgreSQL/SQL Server).
     * Fast attempts with equal jitter to reduce resource lock wait times.
     */
    public static database(custom: Partial<RetryOptions> = {}): RetryOptions {
        return {
            maxAttempts: 5,
            initialDelayMs: 100,
            maxDelayMs: 5000,
            multiplier: 2,
            jitter: "equal",
            delayStrategy: "exponential",
            timeoutMs: 15000,
            attemptTimeoutMs: 3000,
            ...custom
        };
    }

    /**
     * Resilient policy for asynchronous queue consumers and producers.
     */
    public static queue(custom: Partial<RetryOptions> = {}): RetryOptions {
        return {
            maxAttempts: 10,
            initialDelayMs: 2000,
            maxDelayMs: 60000,
            multiplier: 1.5,
            jitter: "decorrelated",
            delayStrategy: "exponential",
            timeoutMs: 300000,
            ...custom
        };
    }

    /**
     * Resilient policy for remote blob/file storage operations (e.g., AWS S3, Azure Blob).
     */
    public static storage(custom: Partial<RetryOptions> = {}): RetryOptions {
        return {
            maxAttempts: 4,
            initialDelayMs: 1000,
            maxDelayMs: 20000,
            multiplier: 2,
            jitter: "decorrelated",
            delayStrategy: "exponential",
            timeoutMs: 90000,
            attemptTimeoutMs: 30000,
            ...custom
        };
    }

    /**
     * Resilient policy for local file system IO operations.
     */
    public static filesystem(custom: Partial<RetryOptions> = {}): RetryOptions {
        return {
            maxAttempts: 3,
            initialDelayMs: 200,
            maxDelayMs: 2000,
            multiplier: 2,
            jitter: "none",
            delayStrategy: "linear",
            timeoutMs: 10000,
            attemptTimeoutMs: 2000,
            ...custom
        };
    }

    /**
     * Custom policy wrapper.
     */
    public static custom(options: RetryOptions): RetryOptions {
        return options;
    }
}
