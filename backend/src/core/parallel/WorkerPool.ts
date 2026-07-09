import { Worker } from "./Worker";
import { RetryEngine } from "../retry/RetryEngine";
import { EventBus } from "../events/EventBus";

export class WorkerPool {
    private workers: Worker[] = [];

    constructor(
        private readonly concurrency: number,
        private readonly retryEngine: RetryEngine,
        private readonly eventBus?: EventBus
    ) {
        this.initializePool();
    }

    private initializePool(): void {
        for (let i = 0; i < this.concurrency; i++) {
            const id = `worker-${i}`;
            const worker = new Worker(id, this.retryEngine, this.eventBus);
            this.workers.push(worker);

            if (this.eventBus) {
                this.eventBus.publish("worker:started" as any, {
                    workerId: id,
                    timestamp: new Date()
                });
            }
        }
    }

    /**
     * Allocates an idle worker (or resets and returns a failed worker).
     * Returns null if all workers are currently busy.
     */
    public allocate(): Worker | null {
        let worker = this.workers.find((w) => w.getState() === "idle");
        if (!worker) {
            const failedWorker = this.workers.find((w) => w.getState() === "failed");
            if (failedWorker) {
                failedWorker.resetState();
                worker = failedWorker;
            }
        }
        return worker || null;
    }

    public getWorkers(): Worker[] {
        return this.workers;
    }

    public getBusyWorkersCount(): number {
        return this.workers.filter((w) => w.getState() === "busy").length;
    }

    public getIdleWorkersCount(): number {
        return this.workers.filter((w) => w.getState() === "idle").length;
    }

    /**
     * Gracefully clears out the worker references and broadcasts stopped events.
     */
    public async shutdown(): Promise<void> {
        for (const worker of this.workers) {
            if (this.eventBus) {
                this.eventBus.publish("worker:stopped" as any, {
                    workerId: worker.id,
                    timestamp: new Date()
                });
            }
        }
        this.workers = [];
    }
}
