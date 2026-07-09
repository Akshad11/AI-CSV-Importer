export type ErrorClassification =
    | "retryable"
    | "fatal"
    | "cancelled"
    | "timeout"
    | "unknown";

export class RetryClassifier {
    /**
     * Classifies an error into retryable, fatal, cancelled, timeout, or unknown.
     */
    public static classify(error: any): ErrorClassification {
        if (!error) {
            return "unknown";
        }

        // 1. Cancellation Detection
        if (
            error.name === "RetryCancelledError" ||
            error.name === "AbortError" ||
            error.message?.includes("cancelled") ||
            error.message?.includes("cancellation") ||
            error.code === "ERR_CANCELED"
        ) {
            return "cancelled";
        }

        // 2. Timeout Detection
        if (
            error.name === "RetryTimeoutError" ||
            error.code === "ETIMEDOUT" ||
            error.code === "timeout" ||
            error.message?.includes("timeout") ||
            error.message?.includes("timed out")
        ) {
            return "timeout";
        }

        // 3. Validation and Malformed Syntax Errors (Fatal, non-retryable)
        const name = String(error.name || "");
        const msg = String(error.message || "").toLowerCase();

        if (
            name.includes("ZodError") ||
            name.includes("ValidationError") ||
            name.includes("SyntaxError") ||
            name.includes("TypeError") ||
            msg.includes("validation") ||
            msg.includes("invalid json") ||
            msg.includes("json parse") ||
            msg.includes("malformed") ||
            msg.includes("unsupported")
        ) {
            return "fatal";
        }

        // 4. HTTP Status Code Checks
        const status =
            error.status ||
            error.statusCode ||
            error.response?.status ||
            error.response?.statusCode;

        if (status) {
            // Server errors (5xx), client timeouts (408), and rate limits (429) are retryable
            if (
                status === 408 ||
                status === 429 ||
                status === 500 ||
                status === 502 ||
                status === 503 ||
                status === 504
            ) {
                return "retryable";
            }
            
            // Other client errors (400, 401, 403, 404) are fatal
            if (status >= 400 && status < 500) {
                return "fatal";
            }
        }

        // 5. Database, Network, and Socket Connection issues (Retryable)
        const code = error.code || error.originalError?.code;
        if (
            code === "ECONNRESET" ||
            code === "ENOTFOUND" ||
            code === "ECONNREFUSED" ||
            code === "EADDRINUSE" ||
            code === "EPIPE" ||
            code === "ETIMEDOUT" ||
            msg.includes("fetch failed") ||
            msg.includes("network error") ||
            msg.includes("socket hang up") ||
            msg.includes("dns") ||
            msg.includes("connection closed") ||
            msg.includes("overloaded") ||
            msg.includes("rate limit") ||
            msg.includes("database connection") ||
            msg.includes("deadlock") ||
            msg.includes("query timeout")
        ) {
            return "retryable";
        }

        return "unknown";
    }
}
