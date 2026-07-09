import { ImportReport } from "../../src/core/metrics/MetricsTypes";

export class MetricsBuilder {
    private readonly report: ImportReport = {
        importId: "imp-default",
        timestamp: new Date(),
        summary: {
            success: true,
            durationMs: 1500,
            totalRows: 10,
            processedRows: 10,
            successfulRows: 10,
            failedRows: 0
        },
        statistics: {
            rows: { total: 10, processed: 10, successful: 10, failed: 0, skipped: 0, cancelled: 0 },
            retries: { retryCount: 0, retrySuccess: 0, retryFailure: 0 }
        },
        performance: {
            rowsPerSecond: 6.67,
            batchesPerSecond: 0.67,
            tokensPerSecond: 100,
            averageThroughput: 6.67,
            peakThroughput: 6.67,
            workerUtilization: 0.8,
            queueUtilization: 0.2,
            memoryUsedBytes: 50 * 1024 * 1024,
            memoryLimitBytes: 1024 * 1024 * 1024,
            cpuPercentage: 10,
            executionTimeMs: 1500,
            p50: 150,
            p90: 150,
            p95: 150,
            p99: 150
        },
        errors: {
            validationErrors: 0,
            providerErrors: 0,
            retryErrors: 0,
            timeouts: 0,
            cancellations: 0,
            csvErrors: 0,
            batchErrors: 0,
            jsonErrors: 0,
            unknownErrors: 0,
            profiles: []
        },
        aiUsage: {
            totalTokens: 150,
            promptTokens: 100,
            completionTokens: 50,
            cachedTokens: 0,
            reasoningTokens: 0,
            callsCount: 1,
            byModel: {}
        },
        cost: {
            totalCost: 0.001,
            costPerRow: 0.0001,
            costPerBatch: 0.001,
            estimatedSavings: 0.002,
            projectedMonthlyCost: 1.50
        },
        timeline: [],
        configuration: {},
        warnings: [],
        recommendations: []
    };

    public withImportId(importId: string): this {
        this.report.importId = importId;
        return this;
    }

    public withSummary(summary: Partial<ImportReport["summary"]>): this {
        Object.assign(this.report.summary, summary);
        return this;
    }

    public build(): ImportReport {
        return { ...this.report };
    }
}
