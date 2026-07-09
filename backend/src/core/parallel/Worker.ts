import { RetryEngine } from "../retry/RetryEngine";
import { EventBus } from "../events/EventBus";
import { CancellationToken } from "../cancellation/CancellationToken";
import { WorkerExecutionError } from "./ParallelErrors";

export class Worker {
    private state: "idle" | "busy" | "failed" = "idle";
    private totalTasksProcessed = 0;
    private totalTaskFailures = 0;
    private totalTaskSuccesses = 0;
    private totalActiveTimeMs = 0;

    constructor(
        public readonly id: string,
        private readonly retryEngine: RetryEngine,
        private readonly eventBus?: EventBus
    ) {}

    /**
     * Executes the task using the RetryEngine, managing worker lifecycle states and analytics.
     */
    public async execute<T>(
        task: () => Promise<T>,
        policyNameOrOptions?: any,
        cancellationToken?: CancellationToken,
        batchIndex = 0,
        operationName = "default"
    ): Promise<T> {
        this.state = "busy";
        this.emit("worker:busy", { workerId: this.id, timestamp: new Date() });
        this.emit("parallel:batch:started", { workerId: this.id, timestamp: new Date(), batchIndex });

        const start = Date.now();
        this.totalTasksProcessed++;

        try {
            // Cooperative cancellation check
            if (cancellationToken) {
                cancellationToken.throwIfCancelled();
            }

            const result = await this.retryEngine.execute(
                task,
                policyNameOrOptions || "default",
                cancellationToken,
                operationName
            );

            const duration = Date.now() - start;
            this.totalActiveTimeMs += duration;
            this.totalTaskSuccesses++;
            this.state = "idle";

            this.emit("worker:idle", { workerId: this.id, timestamp: new Date() });
            this.emit("parallel:batch:completed", {
                workerId: this.id,
                timestamp: new Date(),
                batchIndex,
                metrics: { duration }
            });

            return result;
        } catch (error: any) {
            const duration = Date.now() - start;
            this.totalActiveTimeMs += duration;
            this.totalTaskFailures++;
            this.state = "failed";

            this.emit("worker:idle", { workerId: this.id, timestamp: new Date() });
            this.emit("parallel:batch:failed", {
                workerId: this.id,
                timestamp: new Date(),
                batchIndex,
                error,
                metrics: { duration }
            });

            throw new WorkerExecutionError(
                `Worker [${this.id}] failed during execution of batch ${batchIndex}: ${error.message}`,
                this.id,
                batchIndex,
                error
            );
        }
    }

    public getState(): "idle" | "busy" | "failed" {
        return this.state;
    }

    public resetState(): void {
        this.state = "idle";
        this.emit("worker:recovered", { workerId: this.id, timestamp: new Date() });
    }

    public getStatistics() {
        return {
            workerId: this.id,
            tasksProcessed: this.totalTasksProcessed,
            taskSuccesses: this.totalTaskSuccesses,
            taskFailures: this.totalTaskFailures,
            activeTimeMs: this.totalActiveTimeMs
        };
    }

    private emit(event: string, payload: any): void {
        if (this.eventBus) {
            this.eventBus.publish(event as any, payload);
        }
    }
}
