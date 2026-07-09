import { RateLimitError } from "./errors/RateLimitError";
import { RetryLimitExceededError } from "./errors/RetryLimitExceededError";

export interface RetryOptions {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
}

export class RetryPolicy {
    /**
     * Executes the async action with exponential backoff, jitter, and Retry-After header parsing.
     */
    public static async execute<T>(
        action: () => Promise<T>,
        provider: string,
        model: string,
        options: RetryOptions = {
            maxRetries: 3,
            initialDelayMs: 500,
            maxDelayMs: 10000,
            backoffFactor: 2
        }
    ): Promise<T> {
        let attempt = 0;

        while (true) {
            try {
                attempt++;
                return await action();
            } catch (error: any) {
                if (attempt > options.maxRetries) {
                    throw new RetryLimitExceededError(
                        `Retry limit exceeded after ${options.maxRetries} attempts: ${error.message}`,
                        provider,
                        model,
                        options.maxRetries,
                        error
                    );
                }

                if (!this.isRetryable(error)) {
                    throw error;
                }

                // Determine base delay using exponential backoff
                let delayMs = options.initialDelayMs * Math.pow(options.backoffFactor, attempt - 1);

                // Add random jitter (10% fluctuation) to avoid synchronized retry storms
                const jitter = Math.random() * 0.1 * delayMs;
                delayMs = Math.min(delayMs + jitter, options.maxDelayMs);

                // If a Retry-After header is present, respect it
                const retryAfterHeader = this.getRetryAfterHeader(error);
                if (retryAfterHeader !== null) {
                    delayMs = retryAfterHeader * 1000;
                }

                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    /**
     * Identifies whether the error is transient/retryable (429, 500, 503, network failures)
     * and NOT a client error (400, 401, 403, 422).
     */
    private static isRetryable(error: any): boolean {
        if (!error) return false;

        // Network connection issues
        const code = error.code || error.originalError?.code;
        if (
            code === "ECONNRESET" ||
            code === "ETIMEDOUT" ||
            code === "ENOTFOUND" ||
            code === "ECONNREFUSED" ||
            code === "EADDRINUSE" ||
            error.message?.includes("fetch failed")
        ) {
            return true;
        }

        // Status code lookup
        const status =
            error.status ||
            error.statusCode ||
            error.response?.status ||
            error.response?.statusCode;
            
        if (status) {
            return status === 429 || status === 500 || status === 503;
        }

        // Search message content for common indications of transient network failures
        const msg = String(error.message || "").toLowerCase();
        if (
            msg.includes("rate limit") ||
            msg.includes("429") ||
            msg.includes("500") ||
            msg.includes("503") ||
            msg.includes("timeout") ||
            msg.includes("network error") ||
            msg.includes("overloaded")
        ) {
            return true;
        }

        return false;
    }

    /**
     * Attempts to extract numeric Retry-After value in seconds from error headers.
     */
    private static getRetryAfterHeader(error: any): number | null {
        if (!error) return null;

        const headers = error.headers || error.response?.headers;
        if (headers) {
            const val = headers["retry-after"] || headers["Retry-After"];
            if (val) {
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                }
            }
        }
        return null;
    }
}
