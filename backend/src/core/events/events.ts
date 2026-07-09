import { ImportStats } from "../types/common";

export interface ImportEventPayload {
    importId: string;
    stage: string;
    timestamp: Date;
    statistics?: ImportStats;
    metadata?: Record<string, unknown>;
}

export interface ProgressEventPayload extends ImportEventPayload {
    progress: number; // 0 to 100
}

export interface RowParsedPayload extends ImportEventPayload {
    rowNumber: number;
    rawRow: Record<string, unknown>;
}

export interface BatchPayload extends ImportEventPayload {
    batchNumber: number;
    totalRows: number;
}

export interface AIPayload extends ImportEventPayload {
    batchNumber: number;
    provider: string;
    model: string;
}

export interface ImportFailedPayload extends ImportEventPayload {
    error: Error;
}

export interface ImportCancelledPayload extends ImportEventPayload {
    reason: string;
}

export interface RetryEventPayload {
    operation: string;
    timestamp: Date;
    attempt?: number;
    delay?: number;
    duration?: number;
    error?: Error;
    statistics?: any;
}

export interface ParallelEventPayload {
    timestamp: Date;
    operation?: string;
    workerId?: string;
    batchIndex?: number;
    queueLength?: number;
    metrics?: any;
    error?: Error;
}

/**
 * EventTypeMap defines the full catalog of events in the system
 * and their associated typed payloads.
 */
export interface EventTypeMap {
    "import:started": ImportEventPayload;
    "parsing:started": ImportEventPayload;
    "parsing:completed": ImportEventPayload;
    "row:parsed": RowParsedPayload;
    "batch:created": BatchPayload;
    "batch:started": BatchPayload;
    "batch:completed": BatchPayload;
    "ai:started": AIPayload;
    "ai:completed": AIPayload;
    "validation:started": ImportEventPayload;
    "validation:completed": ImportEventPayload;
    "import:completed": ImportEventPayload;
    "import:failed": ImportFailedPayload;
    "import:cancelled": ImportCancelledPayload;
    "progress:changed": ProgressEventPayload;
    
    // Reusable Enterprise Retry Engine Events
    "retry:started": RetryEventPayload;
    "retry:attempt": RetryEventPayload;
    "retry:succeeded": RetryEventPayload;
    "retry:failed": RetryEventPayload;
    "retry:exhausted": RetryEventPayload;
    "retry:cancelled": RetryEventPayload;
    "circuit:opened": RetryEventPayload;
    "circuit:closed": RetryEventPayload;
    "circuit:half-opened": RetryEventPayload;

    // Enterprise Parallel Processing Engine Events
    "worker:started": ParallelEventPayload;
    "worker:stopped": ParallelEventPayload;
    "worker:idle": ParallelEventPayload;
    "worker:busy": ParallelEventPayload;
    "worker:recovered": ParallelEventPayload;
    "queue:full": ParallelEventPayload;
    "queue:empty": ParallelEventPayload;
    "parallel:batch:queued": ParallelEventPayload;
    "parallel:batch:dequeued": ParallelEventPayload;
    "parallel:batch:started": ParallelEventPayload;
    "parallel:batch:completed": ParallelEventPayload;
    "parallel:batch:failed": ParallelEventPayload;
    "parallel:started": ParallelEventPayload;
    "parallel:completed": ParallelEventPayload;
    "parallel:cancelled": ParallelEventPayload;
    "backpressure:enabled": ParallelEventPayload;
    "backpressure:disabled": ParallelEventPayload;

    // Enterprise Statistics, Metrics & Reporting Framework Events
    "metrics:statistics:started": MetricsEventPayload;
    "metrics:statistics:updated": MetricsEventPayload;
    "metrics:report:generated": MetricsEventPayload;
    "metrics:collected": MetricsEventPayload;
    "metrics:snapshot:created": MetricsEventPayload;
    "metrics:performance:warning": MetricsEventPayload;
    "metrics:high_memory:warning": MetricsEventPayload;
    "metrics:high_retry:warning": MetricsEventPayload;
    "metrics:slow_batch:warning": MetricsEventPayload;
    "metrics:slow_provider:warning": MetricsEventPayload;
    "metrics:cost_threshold:exceeded": MetricsEventPayload;
    "metrics:analytics:completed": MetricsEventPayload;
}

export interface MetricsEventPayload {
    timestamp: Date;
    operation: string;
    importId?: string;
    metrics?: any;
    warning?: string;
    threshold?: number;
    value?: number;
    error?: Error;
}

export type EventName = keyof EventTypeMap;
