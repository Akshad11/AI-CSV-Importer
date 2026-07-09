import { RetryStatistics } from "./RetryStatistics";

export interface RetryResult<T> {
    /**
     * True if the operation eventually succeeded.
     */
    success: boolean;

    /**
     * The returned data from the operation (if successful).
     */
    data?: T;

    /**
     * The final error causing exhaustion, cancellation, or timeout.
     */
    error?: Error;

    /**
     * Metrics collected during execution.
     */
    statistics: RetryStatistics;
}
