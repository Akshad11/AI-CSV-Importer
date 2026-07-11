import { CancellationToken } from "../../core/cancellation/CancellationToken";
import { CancellationError } from "../../core/cancellation/CancellationError";

export interface QueueItem<T> {
    id: string;
    priority: number; // Higher numbers represent higher priority
    task: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: any) => void;
    cancellationToken?: CancellationToken;
    enqueuedAt: Date;
}

export class AIRequestQueue {
    private queue: QueueItem<any>[] = [];
    private activeCount = 0;

    constructor(
        private readonly concurrencyLimit: number = 5,
        private readonly maxQueueSize: number = 200
    ) {}

    public enqueue<T>(
        task: () => Promise<T>,
        priority = 0,
        cancellationToken?: CancellationToken,
        id = Math.random().toString(36).substring(7)
    ): Promise<T> {
        if (this.queue.length >= this.maxQueueSize) {
            return Promise.reject(new Error("AI Request Queue size limit exceeded"));
        }

        return new Promise<T>((resolve, reject) => {
            const item: QueueItem<T> = {
                id,
                priority,
                task,
                resolve,
                reject,
                cancellationToken,
                enqueuedAt: new Date()
            };

            this.queue.push(item);
            // Sort by priority desc, then by enqueue time asc
            this.queue.sort((a, b) => {
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return a.enqueuedAt.getTime() - b.enqueuedAt.getTime();
            });

            this.process();
        });
    }

    public size(): number {
        return this.queue.length;
    }

    public active(): number {
        return this.activeCount;
    }

    private async process(): Promise<void> {
        if (this.activeCount >= this.concurrencyLimit || this.queue.length === 0) {
            return;
        }

        const item = this.queue.shift()!;
        
        if (item.cancellationToken?.isCancelled) {
            item.reject(new CancellationError("AI Request was cancelled while waiting in queue."));
            // Process next
            setTimeout(() => this.process(), 0);
            return;
        }

        this.activeCount++;
        try {
            const result = await item.task();
            item.resolve(result);
        } catch (error) {
            item.reject(error);
        } finally {
            this.activeCount--;
            // Process next
            setTimeout(() => this.process(), 0);
        }
    }
}
export { AIRequestQueue as RequestQueue };
