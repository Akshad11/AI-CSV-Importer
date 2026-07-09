export interface QueueStatistics {
    /**
     * Total number of batches queued since engine startup.
     */
    queuedCount: number;

    /**
     * Total number of batches successfully dequeued and processed.
     */
    dequeuedCount: number;

    /**
     * The peak length reached by the queue.
     */
    maxQueueLengthReached: number;

    /**
     * Frequency of high watermark hits triggering throttling.
     */
    highWatermarkHits: number;

    /**
     * Frequency of low watermark releases restoring ingestion.
     */
    lowWatermarkHits: number;
}

export function createEmptyQueueStatistics(): QueueStatistics {
    return {
        queuedCount: 0,
        dequeuedCount: 0,
        maxQueueLengthReached: 0,
        highWatermarkHits: 0,
        lowWatermarkHits: 0
    };
}
