import { RetryOptions } from "./RetryOptions";
import { RetryContext } from "./RetryContext";
import { RetryResult } from "./RetryResult";
import { RetryStatistics, createEmptyStatistics } from "./RetryStatistics";
import { RetryStrategy } from "./RetryStrategy";
import { DelayStrategy } from "./DelayStrategy";
import { CircuitBreaker } from "./CircuitBreaker";
import { EventBus } from "../events/EventBus";
import { ILogger } from "../interfaces/ILogger";
import { CancellationToken } from "../cancellation/CancellationToken";
import {
    RetryTimeoutError,
    RetryCancelledError,
    RetryExhaustedError,
    CircuitBreakerOpenError
} from "./RetryError";

export class RetryExecutor {
    private readonly strategy: RetryStrategy;

    constructor(
        private readonly options: RetryOptions,
        private readonly circuitBreaker?: CircuitBreaker,
        private readonly eventBus?: EventBus,
        private readonly logger?: ILogger,
        private readonly cancellationToken?: CancellationToken,
        private readonly operationName: string = "default"
    ) {
        this.strategy = new RetryStrategy(options);
    }

    /**
     * Executes the operations inside a retry loop, applying timeouts, jitter, circuit breakers, and cancellation rules.
     */
    public async execute<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
        const stats = createEmptyStatistics();
        const startTime = Date.now();
        stats.succeeded = false;

        let previousDelayMs = 0;
        let attempt = 0;

        // 1. Circuit Breaker Resiliency Check
        if (this.circuitBreaker && !this.circuitBreaker.allowExecution()) {
            const cbError = new CircuitBreakerOpenError(
                `Circuit breaker for operation [${this.operationName}] is OPEN. Execution blocked.`,
                this.circuitBreaker.getState(),
                this.circuitBreaker.getFailureCount(),
                this.options.initialDelayMs
            );
            stats.failed = true;
            stats.lastError = cbError;
            stats.executionTimeMs = Date.now() - startTime;

            this.emit("retry:exhausted", {
                operation: this.operationName,
                timestamp: new Date(),
                error: cbError,
                statistics: stats
            });

            return {
                success: false,
                error: cbError,
                statistics: stats
            };
        }

        this.emit("retry:started", {
            operation: this.operationName,
            timestamp: new Date(),
            statistics: stats
        });

        while (true) {
            // Cooperative cancellation check
            if (this.cancellationToken && this.cancellationToken.isCancelled) {
                const cancelError = new RetryCancelledError(
                    `Operation [${this.operationName}] was cancelled via CancellationToken.`
                );
                stats.cancelled = true;
                stats.lastError = cancelError;
                stats.executionTimeMs = Date.now() - startTime;

                this.emit("retry:cancelled", {
                    operation: this.operationName,
                    timestamp: new Date(),
                    error: cancelError,
                    statistics: stats
                });

                return {
                    success: false,
                    error: cancelError,
                    statistics: stats
                };
            }

            // Overall accumulated timeout check
            const totalElapsed = Date.now() - startTime;
            if (this.options.timeoutMs && totalElapsed >= this.options.timeoutMs) {
                const timeoutError = new RetryTimeoutError(
                    `Retry execution overall timeout of ${this.options.timeoutMs}ms exceeded.`,
                    totalElapsed
                );
                stats.failed = true;
                stats.lastError = timeoutError;
                stats.executionTimeMs = totalElapsed;

                this.emit("retry:exhausted", {
                    operation: this.operationName,
                    timestamp: new Date(),
                    error: timeoutError,
                    statistics: stats
                });

                return {
                    success: false,
                    error: timeoutError,
                    statistics: stats
                };
            }

            attempt++;
            stats.attempts = attempt;
            const attemptStart = Date.now();

            this.logger?.info(
                `[RetryExecutor] Attempt ${attempt}/${this.options.maxAttempts} starting for [${this.operationName}]`
            );

            try {
                // Execute individual attempt with per-attempt and overall timeout limits
                let attemptPromise = operation();

                const overallTimeoutRemaining = this.options.timeoutMs
                    ? this.options.timeoutMs - (Date.now() - startTime)
                    : undefined;

                const attemptTimeout = this.options.attemptTimeoutMs;

                let activeTimeout: number | undefined;
                if (overallTimeoutRemaining !== undefined && attemptTimeout !== undefined) {
                    activeTimeout = Math.min(overallTimeoutRemaining, attemptTimeout);
                } else {
                    activeTimeout = overallTimeoutRemaining ?? attemptTimeout;
                }

                if (activeTimeout !== undefined && activeTimeout <= 0) {
                    throw new RetryTimeoutError(
                        `Retry execution overall timeout of ${this.options.timeoutMs}ms exceeded.`,
                        Date.now() - startTime
                    );
                }

                if (activeTimeout !== undefined && activeTimeout > 0) {
                    let timerId: NodeJS.Timeout;
                    const timeoutPromise = new Promise<never>((_, reject) => {
                        timerId = setTimeout(() => {
                            const isOverall = overallTimeoutRemaining !== undefined && activeTimeout === overallTimeoutRemaining;
                            if (isOverall) {
                                reject(
                                    new RetryTimeoutError(
                                        `Retry execution overall timeout of ${this.options.timeoutMs}ms exceeded.`,
                                        Date.now() - startTime
                                    )
                                );
                            } else {
                                reject(
                                    new RetryTimeoutError(
                                        `Attempt ${attempt} timed out after ${this.options.attemptTimeoutMs}ms.`,
                                        Date.now() - attemptStart
                                    )
                                );
                            }
                        }, activeTimeout);
                    });

                    // Clear timer on resolution to prevent memory leaks
                    attemptPromise = Promise.race([attemptPromise, timeoutPromise]).finally(() => {
                        clearTimeout(timerId);
                    }) as any;
                }

                const result = await attemptPromise;
                const attemptDuration = Date.now() - attemptStart;

                stats.executionTimeMs = Date.now() - startTime;
                stats.averageAttemptTimeMs =
                    (stats.averageAttemptTimeMs * (attempt - 1) + attemptDuration) / attempt;

                // Validate success predicate assertion if supplied
                if (this.options.successPredicate && !this.options.successPredicate(result)) {
                    throw new Error("Operation return value failed successPredicate assertion.");
                }

                // Successful execution
                stats.succeeded = true;
                this.circuitBreaker?.recordSuccess();

                this.emit("retry:succeeded", {
                    operation: this.operationName,
                    timestamp: new Date(),
                    attempt,
                    duration: attemptDuration,
                    statistics: stats
                });

                this.logger?.info(
                    `[RetryExecutor] Operation [${this.operationName}] SUCCEEDED on attempt ${attempt} in ${attemptDuration}ms`
                );

                return {
                    success: true,
                    data: result,
                    statistics: stats
                };
            } catch (error: any) {
                const attemptDuration = Date.now() - attemptStart;
                stats.lastError = error;
                stats.averageAttemptTimeMs =
                    (stats.averageAttemptTimeMs * (attempt - 1) + attemptDuration) / attempt;

                this.circuitBreaker?.recordFailure();

                if (error.name === "RetryTimeoutError" && error.message.includes("overall timeout")) {
                    stats.failed = true;
                    stats.executionTimeMs = Date.now() - startTime;
                    this.emit("retry:exhausted", {
                        operation: this.operationName,
                        timestamp: new Date(),
                        attempt,
                        error,
                        statistics: stats
                    });
                    return { success: false, error, statistics: stats };
                }

                const context: RetryContext = {
                    attempt,
                    startTime,
                    elapsedTime: Date.now() - startTime,
                    lastError: error,
                    previousDelayMs
                };

                this.emit("retry:attempt", {
                    operation: this.operationName,
                    timestamp: new Date(),
                    attempt,
                    duration: attemptDuration,
                    error,
                    statistics: stats
                });

                if (this.strategy.shouldRetry(error, context)) {
                    const delay = DelayStrategy.calculate(
                        attempt,
                        this.options.delayStrategy,
                        this.options.initialDelayMs,
                        this.options.maxDelayMs,
                        this.options.multiplier,
                        this.options.jitter,
                        previousDelayMs,
                        this.options.customDelayCalculator,
                        error
                    );

                    stats.totalDelayMs += delay;
                    stats.backoffTimeMs += delay;
                    previousDelayMs = delay;

                    this.logger?.warn(
                        `[RetryExecutor] Operation [${this.operationName}] FAILED on attempt ${attempt} (${error.message}). Retrying in ${delay}ms...`
                    );

                    this.emit("retry:failed", {
                        operation: this.operationName,
                        attempt,
                        delay,
                        error,
                        timestamp: new Date(),
                        statistics: stats
                    });

                    // Wait delay duration, waking up early if cancellation fires
                    await new Promise<void>((resolve) => {
                        let timeoutId: NodeJS.Timeout;
                        let intervalId: NodeJS.Timeout;

                        const cleanup = () => {
                            clearTimeout(timeoutId);
                            clearInterval(intervalId);
                        };

                        timeoutId = setTimeout(() => {
                            cleanup();
                            resolve();
                        }, delay);

                        intervalId = setInterval(() => {
                            if (this.cancellationToken?.isCancelled) {
                                cleanup();
                                resolve();
                            }
                        }, Math.min(50, delay));
                    });
                } else {
                    stats.failed = true;
                    stats.executionTimeMs = Date.now() - startTime;

                    const finalError =
                        context.attempt >= this.options.maxAttempts
                            ? new RetryExhaustedError(
                                  `Operation [${this.operationName}] failed after reaching maximum of ${this.options.maxAttempts} attempts: ${error.message}`,
                                  attempt,
                                  error
                              )
                            : error;

                    this.emit("retry:exhausted", {
                        operation: this.operationName,
                        timestamp: new Date(),
                        attempt,
                        error: finalError,
                        statistics: stats
                    });

                    this.logger?.error(
                        `[RetryExecutor] Operation [${this.operationName}] EXHAUSTED/FATAL on attempt ${attempt}. Error: ${finalError.message}`
                    );

                    return {
                        success: false,
                        error: finalError,
                        statistics: stats
                    };
                }
            }
        }
    }

    private emit(event: string, payload: any): void {
        if (this.eventBus) {
            this.eventBus.publish(event as any, payload);
        }
    }
}
