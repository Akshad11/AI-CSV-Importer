import { RowStatistics, RetryStatistics } from "./MetricsTypes";

export class StatisticsCollector {
    private total = 0;
    private processed = 0;
    private successful = 0;
    private failed = 0;
    private skipped = 0;
    private cancelled = 0;

    private retryCount = 0;
    private retrySuccess = 0;
    private retryFailure = 0;

    public setTotalRows(count: number): void {
        this.total = count;
    }

    public incrementProcessed(count = 1): void {
        this.processed += count;
    }

    public incrementSuccessful(count = 1): void {
        this.successful += count;
    }

    public incrementFailed(count = 1): void {
        this.failed += count;
    }

    public incrementSkipped(count = 1): void {
        this.skipped += count;
    }

    public incrementCancelled(count = 1): void {
        this.cancelled += count;
    }

    public incrementRetry(success: boolean): void {
        this.retryCount++;
        if (success) {
            this.retrySuccess++;
        } else {
            this.retryFailure++;
        }
    }

    public getRowStatistics(): RowStatistics {
        return {
            total: this.total,
            processed: this.processed,
            successful: this.successful,
            failed: this.failed,
            skipped: this.skipped,
            cancelled: this.cancelled
        };
    }

    public getRetryStatistics(): RetryStatistics {
        return {
            retryCount: this.retryCount,
            retrySuccess: this.retrySuccess,
            retryFailure: this.retryFailure
        };
    }
}
