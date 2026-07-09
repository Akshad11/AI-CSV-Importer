import { WorkerPool } from "../../src/core/parallel/WorkerPool";
import { RetryEngine } from "../../src/core/retry/RetryEngine";
import { EventBus } from "../../src/core/events/EventBus";

export class MockWorkerPool extends WorkerPool {
    constructor(retryEngine: RetryEngine, eventBus?: EventBus) {
        super(2, retryEngine, eventBus);
    }
}
