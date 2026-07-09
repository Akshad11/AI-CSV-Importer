export interface RowStatistics {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    skipped: number;
    cancelled: number;
}

export interface RetryStatistics {
    retryCount: number;
    retrySuccess: number;
    retryFailure: number;
}

export interface AIStatistics {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    cachedTokens: number;
    reasoningTokens: number;
    totalTokens: number;
    promptSizeBytes: number;
    responseSizeBytes: number;
    averageLatencyMs: number;
    fastestLatencyMs: number;
    slowestLatencyMs: number;
    retries: number;
    failures: number;
    timeouts: number;
    estimatedCost: number;
    actualCost: number;
    costPerRow: number;
    costPerBatch: number;
}

export interface PerformanceMetrics {
    rowsPerSecond: number;
    batchesPerSecond: number;
    tokensPerSecond: number;
    averageThroughput: number;
    peakThroughput: number;
    workerUtilization: number;
    queueUtilization: number;
    memoryUsedBytes: number;
    memoryLimitBytes: number;
    cpuPercentage: number;
    executionTimeMs: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
}

export interface ErrorProfile {
    type: string;
    message: string;
    stage: string;
    provider?: string;
    batchIndex?: number;
    timestamp: Date;
    frequency: number;
}

export interface ErrorSummary {
    validationErrors: number;
    providerErrors: number;
    retryErrors: number;
    timeouts: number;
    cancellations: number;
    csvErrors: number;
    batchErrors: number;
    jsonErrors: number;
    unknownErrors: number;
    profiles: ErrorProfile[];
}

export interface BatchMetrics {
    batchIndex: number;
    batchSize: number;
    durationMs: number;
    queueDelayMs: number;
    processingDelayMs: number;
    success: boolean;
    retries: number;
    failures: number;
}

export interface ImportReport {
    importId: string;
    timestamp: Date;
    summary: {
        success: boolean;
        durationMs: number;
        totalRows: number;
        processedRows: number;
        successfulRows: number;
        failedRows: number;
    };
    statistics: {
        rows: RowStatistics;
        retries: RetryStatistics;
    };
    performance: PerformanceMetrics;
    errors: ErrorSummary;
    aiUsage: {
        totalTokens: number;
        promptTokens: number;
        completionTokens: number;
        cachedTokens: number;
        reasoningTokens: number;
        callsCount: number;
        byModel: Record<string, { calls: number; tokens: number; cost: number }>;
    };
    cost: {
        totalCost: number;
        costPerRow: number;
        costPerBatch: number;
        estimatedSavings: number;
        projectedMonthlyCost: number;
    };
    timeline: {
        stage: string;
        timestamp: Date;
        durationMs: number;
    }[];
    configuration: Record<string, any>;
    warnings: string[];
    recommendations: string[];
}
