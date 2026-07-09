export interface QueueItem<T = any> {
    /**
     * Unique identifier for the queued item.
     */
    id: string;

    /**
     * Payload containing the data/rows of the batch.
     */
    data: T;

    /**
     * Priority level of the task (higher values represent higher priority).
     */
    priority: number;

    /**
     * The sequential sequence index indicating the insertion order.
     * Essential for ordered execution completion guarantees.
     */
    index: number;

    /**
     * Timestamp indicating when the item entered the queue.
     */
    timestamp: Date;
}
