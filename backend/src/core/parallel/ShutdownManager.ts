import { BatchQueue } from "./BatchQueue";
import { WorkerPool } from "./WorkerPool";
import { EventBus } from "../events/EventBus";

export class ShutdownManager {
    constructor(
        private readonly queue: BatchQueue,
        private readonly workerPool: WorkerPool,
        private readonly eventBus?: EventBus,
        private readonly operationName = "default"
    ) {}

    /**
     * Halts ingestion, waits for busy workers to resolve up to a timeout threshold, and shuts down pool resources.
     */
    public async shutdown(timeoutMs = 10000): Promise<void> {
        this.queue.pause();

        const start = Date.now();
        while (this.workerPool.getBusyWorkersCount() > 0) {
            if (Date.now() - start >= timeoutMs) {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        this.queue.clear();
        await this.workerPool.shutdown();
    }
}
