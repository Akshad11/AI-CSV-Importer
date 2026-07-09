export interface QueueConfiguration {
    /**
     * Maximum capacity bounds of the batch queue.
     */
    maxQueueSize: number;

    /**
     * Threshold queue length percentage (0.0 to 1.0) above which backpressure triggers.
     */
    highWatermark: number;

    /**
     * Threshold queue length percentage (0.0 to 1.0) below which backpressure releases.
     */
    lowWatermark: number;
}

export const DEFAULT_QUEUE_CONFIG: QueueConfiguration = {
    maxQueueSize: 100,
    highWatermark: 0.8, // 80% full triggers intake throttle
    lowWatermark: 0.3  // 30% full resumes intake
};
