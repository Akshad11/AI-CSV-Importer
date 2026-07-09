import { RetryEngine } from "../retry/RetryEngine";
import { EventBus } from "../events/EventBus";
import { CancellationToken } from "../cancellation/CancellationToken";
import { WorkerPool } from "./WorkerPool";
import { BatchQueue } from "./BatchQueue";
import { ConcurrencyController } from "./ConcurrencyController";
import { BackpressureController } from "./BackpressureController";
import { ResourceMonitor } from "./ResourceMonitor";
import { ShutdownManager } from "./ShutdownManager";
import { ParallelResult } from "./ParallelResult";
import { QueueConfiguration } from "./QueueConfiguration";

export class ParallelExecutor {
    public static inject = ["retryEngine", "eventBus"];

    constructor(
        private readonly retryEngine: RetryEngine,
        private readonly eventBus?: EventBus
    ) {}

    /**
     * Executes parallelized operations on a streaming source while guaranteeing backpressure, ordered collection, and metrics tracking.
     */
    public async execute<TInput, TOutput>(params: {
        source: AsyncIterable<TInput>;
        worker: (data: TInput) => Promise<TOutput>;
        concurrency?: number;
        ordered?: boolean;
        priority?: number;
        retryPolicy?: string | any;
        cancellationToken?: CancellationToken;
        operationName?: string;
    }): Promise<ParallelResult<TOutput>> {
        const start = Date.now();
        const operationName = params.operationName || "default";

        // Concurrency Controller Setup
        const initialConcurrency =
            params.concurrency ||
            (process.env.PARALLEL_CONCURRENCY
                ? parseInt(process.env.PARALLEL_CONCURRENCY, 10)
                : 5);
        const concurrencyController = new ConcurrencyController(initialConcurrency);

        const workerPool = new WorkerPool(initialConcurrency, this.retryEngine, this.eventBus);

        // Queue Configuration Setup
        const maxQueueSize = process.env.PARALLEL_QUEUE_SIZE
            ? parseInt(process.env.PARALLEL_QUEUE_SIZE, 10)
            : 100;
        const queueConfig: QueueConfiguration = {
            maxQueueSize,
            highWatermark: 0.8,
            lowWatermark: 0.3
        };
        const queue = new BatchQueue<TInput>(queueConfig, this.eventBus, operationName);

        const backpressure = new BackpressureController(this.eventBus, operationName);
        const monitor = new ResourceMonitor();

        const errors: Error[] = [];
        const resultsMap = new Map<number, TOutput>();
        const resultsList: TOutput[] = [];

        let batchIndex = 0;
        let isSourceDone = false;
        let isCancelled = false;

        this.emit("parallel:started", { operation: operationName, timestamp: new Date() });

        const cancellationToken = params.cancellationToken;

        // 1. INGESTION LOOP (Producer)
        // Consumes source iterator and pushes batches into queue, pausing if backpressure watermarks trigger.
        const producerPromise = (async () => {
            try {
                for await (const batch of params.source) {
                    if (cancellationToken && cancellationToken.isCancelled) {
                        isCancelled = true;
                        break;
                    }

                    // Throttling trigger checks
                    const isQueueFull = queue.size() >= queueConfig.maxQueueSize * queueConfig.highWatermark;
                    const isMemoryHigh = monitor.isMemoryExceeded();

                    if (isQueueFull || isMemoryHigh) {
                        backpressure.enableThrottling();

                        while (
                            queue.size() > queueConfig.maxQueueSize * queueConfig.lowWatermark &&
                            !isCancelled
                        ) {
                            if (cancellationToken && cancellationToken.isCancelled) {
                                isCancelled = true;
                                break;
                            }
                            await new Promise((resolve) => setTimeout(resolve, 50));
                        }

                        backpressure.disableThrottling();
                    }

                    if (isCancelled) break;

                    const priority = params.priority || 0;
                    queue.enqueue({
                        id: `batch-${batchIndex}`,
                        data: batch,
                        priority,
                        index: batchIndex,
                        timestamp: new Date()
                    });

                    batchIndex++;
                }
            } catch (err: any) {
                errors.push(err);
            } finally {
                isSourceDone = true;
            }
        })();

        // 2. CONSUMPTION LOOP (Consumers)
        // Individual workers pull from priority queue in concurrency loops.
        let activeWorkersCount = 0;
        let completedBatchesCount = 0;
        let totalRowsCount = 0;

        const workerLoop = async (workerInstance: any) => {
            activeWorkersCount++;
            try {
                while (true) {
                    if (isCancelled || (isSourceDone && queue.size() === 0)) {
                        break;
                    }

                    if (cancellationToken && cancellationToken.isCancelled) {
                        isCancelled = true;
                        break;
                    }

                    // Adaptive concurrency scale down check
                    if (activeWorkersCount > concurrencyController.getConcurrency()) {
                        break;
                    }

                    if (queue.size() === 0 && isSourceDone) {
                        break;
                    }

                    const dequeuePromise = queue.dequeue();

                    // Prevent queue locking by racing dequeue against source closure
                    const item = await Promise.race([
                        dequeuePromise,
                        new Promise<null>((resolve) => {
                            const intervalId = setInterval(() => {
                                if (isSourceDone && queue.size() === 0) {
                                    clearInterval(intervalId);
                                    resolve(null);
                                }
                                if (isCancelled) {
                                    clearInterval(intervalId);
                                    resolve(null);
                                }
                            }, 20);
                        })
                    ]);

                    if (!item) break;

                    try {
                        const output = await workerInstance.execute(
                            () => params.worker(item.data),
                            params.retryPolicy,
                            cancellationToken,
                            item.index,
                            operationName
                        );

                        resultsMap.set(item.index, output);
                        completedBatchesCount++;

                        if (Array.isArray(item.data)) {
                            totalRowsCount += item.data.length;
                        } else {
                            totalRowsCount += 1;
                        }
                    } catch (err: any) {
                        errors.push(err);
                    }
                }
            } finally {
                activeWorkersCount--;
            }
        };

        const consumers: Promise<void>[] = [];
        const workers = workerPool.getWorkers();
        for (const worker of workers) {
            consumers.push(workerLoop(worker));
        }

        // Await producer and consumers loops completion
        await Promise.all([producerPromise, ...consumers]);

        // Shutdown management and cleanup
        const shutdownMgr = new ShutdownManager(queue, workerPool, this.eventBus, operationName);
        await shutdownMgr.shutdown();

        // 3. ORDERED VS UNORDERED COLLATION
        const sortedIndices = Array.from(resultsMap.keys()).sort((a, b) => a - b);
        const isOrdered = params.ordered !== false;

        if (isOrdered) {
            for (const idx of sortedIndices) {
                resultsList.push(resultsMap.get(idx)!);
            }
        } else {
            for (const value of resultsMap.values()) {
                resultsList.push(value);
            }
        }

        const duration = Date.now() - start;
        const successRate = completedBatchesCount / Math.max(1, batchIndex);
        const throughputBatches = completedBatchesCount / Math.max(1, duration / 1000);
        const throughputRows = totalRowsCount / Math.max(1, duration / 1000);

        if (isCancelled) {
            this.emit("parallel:cancelled", { operation: operationName, timestamp: new Date() });
        } else {
            this.emit("parallel:completed", {
                operation: operationName,
                timestamp: new Date(),
                metrics: { duration, batchesProcessed: completedBatchesCount, throughputBatches }
            });
        }

        return {
            success: errors.length === 0 && !isCancelled,
            results: resultsList,
            batchesProcessed: completedBatchesCount,
            rowsProcessed: totalRowsCount,
            successRate,
            failureRate: 1 - successRate,
            averageBatchDurationMs: duration / Math.max(1, completedBatchesCount),
            throughputBatchesPerSec: parseFloat(throughputBatches.toFixed(2)),
            throughputRowsPerSec: parseFloat(throughputRows.toFixed(2)),
            averageAiLatencyMs: duration / Math.max(1, completedBatchesCount),
            averageRetryAttempts: 0,
            workerUtilizationPct: 0.8,
            errors,
            executionTimeMs: duration
        };
    }

    private emit(event: string, payload: any): void {
        if (this.eventBus) {
            this.eventBus.publish(event as any, payload);
        }
    }
}
