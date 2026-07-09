import { QueueItem } from "./QueueItem";
import { QueueConfiguration, DEFAULT_QUEUE_CONFIG } from "./QueueConfiguration";
import { QueueStatistics, createEmptyQueueStatistics } from "./QueueStatistics";
import { QueueCapacityExceededError } from "./ParallelErrors";
import { EventBus } from "../events/EventBus";

export class BatchQueue<T = any> {
    private items: QueueItem<T>[] = [];
    private paused = false;
    private readonly statistics = createEmptyQueueStatistics();

    private waitingResolvers: ((item: QueueItem<T>) => void)[] = [];
    private drainResolvers: (() => void)[] = [];

    constructor(
        private readonly config: QueueConfiguration = DEFAULT_QUEUE_CONFIG,
        private readonly eventBus?: EventBus,
        private readonly operationName = "default"
    ) {}

    /**
     * Inserts an item into the queue sorted by priority (descending) and index (ascending).
     */
    public enqueue(item: QueueItem<T>): void {
        if (this.items.length >= this.config.maxQueueSize) {
            throw new QueueCapacityExceededError(
                `Queue size exceeded maximum capacity of ${this.config.maxQueueSize}`,
                this.items.length,
                this.config.maxQueueSize
            );
        }

        this.items.push(item);
        this.items.sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            return a.index - b.index;
        });

        this.statistics.queuedCount++;
        this.statistics.maxQueueLengthReached = Math.max(
            this.statistics.maxQueueLengthReached,
            this.items.length
        );

        this.emit("parallel:batch:queued", {
            operation: this.operationName,
            timestamp: new Date(),
            batchIndex: item.index,
            queueLength: this.items.length
        });

        const fillRatio = this.items.length / this.config.maxQueueSize;
        if (fillRatio >= this.config.highWatermark) {
            this.statistics.highWatermarkHits++;
            this.emit("queue:full", {
                operation: this.operationName,
                timestamp: new Date(),
                queueLength: this.items.length,
                metrics: { fillRatio }
            });
        }

        this.processWaitingResolvers();
    }

    /**
     * Dequeues the next item, blocking with a promise if the queue is empty or paused.
     */
    public async dequeue(): Promise<QueueItem<T>> {
        if (this.items.length > 0 && !this.paused) {
            const item = this.items.shift()!;
            this.statistics.dequeuedCount++;

            this.emit("parallel:batch:dequeued", {
                operation: this.operationName,
                timestamp: new Date(),
                batchIndex: item.index,
                queueLength: this.items.length
            });

            const fillRatio = this.items.length / this.config.maxQueueSize;
            if (fillRatio <= this.config.lowWatermark) {
                this.statistics.lowWatermarkHits++;
                this.emit("queue:empty", {
                    operation: this.operationName,
                    timestamp: new Date(),
                    queueLength: this.items.length,
                    metrics: { fillRatio }
                });
            }

            this.checkDrain();
            return item;
        }

        return new Promise<QueueItem<T>>((resolve) => {
            this.waitingResolvers.push(resolve);
        });
    }

    public pause(): void {
        this.paused = true;
    }

    public resume(): void {
        this.paused = false;
        this.processWaitingResolvers();
    }

    public isPaused(): boolean {
        return this.paused;
    }

    public size(): number {
        return this.items.length;
    }

    public getStatistics(): QueueStatistics {
        return this.statistics;
    }

    public clear(): void {
        this.items = [];
        this.waitingResolvers = [];
        this.checkDrain();
    }

    /**
     * Returns a promise that resolves when the queue size falls to 0.
     */
    public async drain(): Promise<void> {
        if (this.items.length === 0) {
            return;
        }
        return new Promise<void>((resolve) => {
            this.drainResolvers.push(resolve);
        });
    }

    private processWaitingResolvers(): void {
        if (this.paused) return;

        while (this.items.length > 0 && this.waitingResolvers.length > 0) {
            const resolver = this.waitingResolvers.shift()!;
            const item = this.items.shift()!;
            this.statistics.dequeuedCount++;

            this.emit("parallel:batch:dequeued", {
                operation: this.operationName,
                timestamp: new Date(),
                batchIndex: item.index,
                queueLength: this.items.length
            });

            resolver(item);
        }

        this.checkDrain();
    }

    private checkDrain(): void {
        if (this.items.length === 0 && this.drainResolvers.length > 0) {
            const resolvers = [...this.drainResolvers];
            this.drainResolvers = [];
            for (const resolve of resolvers) {
                resolve();
            }
        }
    }

    private emit(event: string, payload: any): void {
        if (this.eventBus) {
            this.eventBus.publish(event as any, payload);
        }
    }
}
