import { RetryContext } from "./RetryContext";
import { RetryOptions } from "./RetryOptions";
import { RetryClassifier } from "./RetryClassifier";

export class RetryStrategy {
    constructor(private readonly options: RetryOptions) {}

    /**
     * Determines whether the operation should be retried based on context, options, and error type.
     */
    public shouldRetry(error: Error, context: RetryContext): boolean {
        // Cannot retry if we have reached or exceeded the configured max attempts
        if (context.attempt >= this.options.maxAttempts) {
            return false;
        }

        // Priority 1: User-supplied retry predicate override
        if (this.options.retryPredicate) {
            return this.options.retryPredicate(error);
        }

        // Priority 2: Standard error classification rules
        const classification = RetryClassifier.classify(error);

        switch (classification) {
            case "fatal":
            case "cancelled":
                return false;

            case "timeout":
            case "retryable":
                return true;

            case "unknown":
            default:
                // For unknown errors, safely retry but respect overall attempt limits
                return true;
        }
    }
}
