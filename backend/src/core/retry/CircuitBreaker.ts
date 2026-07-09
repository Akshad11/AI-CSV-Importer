import { EventBus } from "../events/EventBus";

export type CircuitState = "closed" | "open" | "half-open";

export class CircuitBreaker {
    private state: CircuitState = "closed";
    private failureCount = 0;
    private successCount = 0;
    private lastStateTransition: Date = new Date();

    constructor(
        private readonly failureThreshold: number = 5,
        private readonly recoveryTimeoutMs: number = 15000,
        private readonly eventBus?: EventBus,
        private readonly operationName: string = "default"
    ) {}

    /**
     * Checks circuit states and returns whether execution is allowed.
     */
    public allowExecution(): boolean {
        this.checkRecovery();
        return this.state === "closed" || this.state === "half-open";
    }

    /**
     * Records a successful execution.
     */
    public recordSuccess(): void {
        this.checkRecovery();
        if (this.state === "half-open") {
            this.successCount++;
            // Require 3 consecutive successful executions to fully close the circuit
            if (this.successCount >= 3) {
                this.transitionTo("closed");
            }
        } else if (this.state === "closed") {
            this.resetCounters();
        }
    }

    /**
     * Records a failed execution.
     */
    public recordFailure(): void {
        this.checkRecovery();
        this.failureCount++;
        if (this.state === "closed" && this.failureCount >= this.failureThreshold) {
            this.transitionTo("open");
        } else if (this.state === "half-open") {
            // Any failure in half-open state immediately trips it back to open
            this.transitionTo("open");
        }
    }

    public getState(): CircuitState {
        this.checkRecovery();
        return this.state;
    }

    public getOpenDuration(): number {
        if (this.state !== "open") return 0;
        return Date.now() - this.lastStateTransition.getTime();
    }

    public getFailureCount(): number {
        return this.failureCount;
    }

    public getSuccessCount(): number {
        return this.successCount;
    }

    public forceClose(): void {
        this.transitionTo("closed");
    }

    public forceOpen(): void {
        this.transitionTo("open");
    }

    private checkRecovery(): void {
        if (this.state === "open") {
            const elapsed = Date.now() - this.lastStateTransition.getTime();
            if (elapsed >= this.recoveryTimeoutMs) {
                this.transitionTo("half-open");
            }
        }
    }

    private resetCounters(): void {
        this.failureCount = 0;
        this.successCount = 0;
    }

    private transitionTo(newState: CircuitState): void {
        if (this.state === newState) return;

        const oldState = this.state;
        this.state = newState;
        this.lastStateTransition = new Date();
        this.resetCounters();

        if (this.eventBus) {
            const eventName =
                newState === "open"
                    ? "circuit:opened"
                    : newState === "closed"
                    ? "circuit:closed"
                    : "circuit:half-opened";

            this.eventBus.publish(eventName as any, {
                operation: this.operationName,
                timestamp: new Date(),
                statistics: {
                    oldState,
                    newState,
                    failureThreshold: this.failureThreshold,
                    recoveryTimeoutMs: this.recoveryTimeoutMs
                }
            });
        }
    }
}
