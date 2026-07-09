export interface MetricsConfiguration {
    metricsEnabled: boolean;
    reportFormat: "json" | "csv" | "markdown" | "html";
    reportOutputDirectory: string;
    metricsIntervalMs: number;
    costTrackingEnabled: boolean;
    performanceTrackingEnabled: boolean;
    thresholds: {
        memoryPressureLimitPct: number;
        highRetryRateLimitPct: number;
        slowBatchLimitMs: number;
        slowAiCallLimitMs: number;
        costLimitDollars: number;
    };
}

export function loadMetricsConfigFromEnv(): MetricsConfiguration {
    return {
        metricsEnabled: process.env.METRICS_ENABLED !== "false",
        reportFormat: (process.env.REPORT_FORMAT || "json").toLowerCase() as any,
        reportOutputDirectory: process.env.REPORT_OUTPUT || "./reports",
        metricsIntervalMs: parseInt(process.env.METRICS_INTERVAL || "1000", 10),
        costTrackingEnabled: process.env.COST_TRACKING !== "false",
        performanceTrackingEnabled: process.env.PERFORMANCE_TRACKING !== "false",
        thresholds: {
            memoryPressureLimitPct: 0.85, // 85% memory threshold warning
            highRetryRateLimitPct: 0.3,   // 30% retry rate warning
            slowBatchLimitMs: 5000,        // 5s batch delay warning
            slowAiCallLimitMs: 15000,      // 15s AI latency warning
            costLimitDollars: 5.00        // $5 budget limit warnings
        }
    };
}
