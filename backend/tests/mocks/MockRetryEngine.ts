import { RetryEngine } from "../../src/core/retry/RetryEngine";
import { RetryOptions } from "../../src/core/retry/RetryOptions";
import { CancellationToken } from "../../src/core/cancellation/CancellationToken";

export class MockRetryEngine extends RetryEngine {
    private forceFailureCount = 0;
    private currentFailures = 0;

    public setForceFailureCount(count: number): void {
        this.forceFailureCount = count;
        this.currentFailures = 0;
    }

    /**
     * Executes the operation, throwing simulated transient failures first if configured.
     */
    public override async execute<T>(
        operation: () => Promise<T>,
        optionsOrPolicy?: Partial<RetryOptions> | string,
        cancellationToken?: CancellationToken,
        operationName = "default"
    ): Promise<T> {
        if (this.currentFailures < this.forceFailureCount) {
            this.currentFailures++;
            throw new Error(
                `MockRetryEngine simulated transient failure ${this.currentFailures}/${this.forceFailureCount}`
            );
        }
        return operation();
    }
}
