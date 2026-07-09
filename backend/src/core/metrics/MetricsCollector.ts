import { EventBus } from "../events/EventBus";
import { StatisticsCollector } from "./StatisticsCollector";
import { AIAnalytics } from "./AIAnalytics";
import { ErrorAnalytics } from "./ErrorAnalytics";
import { BatchAnalytics } from "./BatchAnalytics";
import { ThroughputCalculator } from "./ThroughputCalculator";
import { PerformanceCollector } from "./PerformanceCollector";
import { MetricsConfiguration, loadMetricsConfigFromEnv } from "./MetricsConfiguration";
import { PerformanceMetrics } from "./MetricsTypes";

export class MetricsCollector {
    public static inject = ["eventBus"];

    public readonly statsCollector = new StatisticsCollector();
    public readonly aiAnalytics = new AIAnalytics();
    public readonly errorAnalytics = new ErrorAnalytics();
    public readonly batchAnalytics = new BatchAnalytics();

    private readonly throughputCalculator = new ThroughputCalculator();
    private readonly performanceCollector = new PerformanceCollector();
    private readonly config: MetricsConfiguration = loadMetricsConfigFromEnv();

    private readonly startTime = Date.now();
    private isRunning = false;
    private lastThresholdCheckTime = 0;

    constructor(
        private readonly eventBus?: EventBus,
        private readonly operationName = "default"
    ) {}

    public start(): void {
        this.isRunning = true;
        this.emit("metrics:statistics:started", {
            operation: this.operationName,
            timestamp: new Date()
        });
    }

    public updateStats(updateFn: (stats: StatisticsCollector) => void): void {
        if (!this.isRunning) return;
        updateFn(this.statsCollector);

        this.emit("metrics:statistics:updated", {
            operation: this.operationName,
            timestamp: new Date(),
            metrics: {
                rows: this.statsCollector.getRowStatistics(),
                retries: this.statsCollector.getRetryStatistics()
            }
        });

        this.checkThresholds();
    }

    public recordCall(call: any): void {
        if (!this.isRunning) return;
        this.aiAnalytics.recordCall(call);

        this.emit("metrics:collected", {
            operation: this.operationName,
            timestamp: new Date(),
            metrics: this.aiAnalytics.getAISummary()
        });

        this.checkThresholds();
    }

    public recordError(error: Error, stage: string, batchIndex?: number, provider?: string): void {
        if (!this.isRunning) return;
        this.errorAnalytics.recordError(error, stage, batchIndex, provider);
        this.statsCollector.incrementFailed();

        this.emit("metrics:collected", {
            operation: this.operationName,
            timestamp: new Date(),
            error
        });
    }

    public recordBatch(batch: any): void {
        if (!this.isRunning) return;
        this.batchAnalytics.recordBatch(batch);
    }

    public collectPerformance(): PerformanceMetrics {
        const rows = this.statsCollector.getRowStatistics();
        const batches = this.batchAnalytics.getBatches();
        const ai = this.aiAnalytics.getAISummary();
        const latencies = this.aiAnalytics.getLogs().map((l) => l.latencyMs);

        const duration = Date.now() - this.startTime;

        const collected = this.performanceCollector.collect(
            rows.processed,
            batches.length,
            ai.totalTokens,
            duration,
            0.8, // Estimate Worker utilization
            batches.length > 0 ? 0.4 : 0, // Estimate Queue utilization
            latencies
        );

        return collected as PerformanceMetrics;
    }

    public stop(): void {
        this.isRunning = false;
        this.emit("metrics:analytics:completed", {
            operation: this.operationName,
            timestamp: new Date()
        });
    }

    private checkThresholds(): void {
        const now = Date.now();
        if (now - this.lastThresholdCheckTime < this.config.metricsIntervalMs) {
            return;
        }
        this.lastThresholdCheckTime = now;

        const stats = this.statsCollector.getRowStatistics();
        const retries = this.statsCollector.getRetryStatistics();
        const ai = this.aiAnalytics.getAISummary();

        // 1. High Memory Check
        const memory = this.performanceCollector.collect(0, 0, 0, 1, 0, 0, []);
        const heapUsed = memory.memoryUsedBytes || 0;
        const heapLimit = memory.memoryLimitBytes || 1024 * 1024 * 1024;
        if (heapUsed / heapLimit >= this.config.thresholds.memoryPressureLimitPct) {
            this.emit("metrics:high_memory:warning", {
                operation: this.operationName,
                timestamp: new Date(),
                warning: `High memory usage: ${(heapUsed / (1024 * 1024)).toFixed(2)}MB used.`,
                threshold: this.config.thresholds.memoryPressureLimitPct,
                value: heapUsed / heapLimit
            });
        }

        // 2. High Retry Rate Check
        const totalAttempts = retries.retryCount;
        if (totalAttempts > 0 && stats.processed > 0) {
            const retryRate = totalAttempts / stats.processed;
            if (retryRate >= this.config.thresholds.highRetryRateLimitPct) {
                this.emit("metrics:high_retry:warning", {
                    operation: this.operationName,
                    timestamp: new Date(),
                    warning: `High retry rate encountered: ${(retryRate * 100).toFixed(2)}%.`,
                    threshold: this.config.thresholds.highRetryRateLimitPct,
                    value: retryRate
                });
            }
        }

        // 3. Slow Provider Check
        if (ai.averageLatencyMs >= this.config.thresholds.slowAiCallLimitMs) {
            this.emit("metrics:slow_provider:warning", {
                operation: this.operationName,
                timestamp: new Date(),
                warning: `AI average latency exceeded limits: ${ai.averageLatencyMs.toFixed(0)}ms`,
                threshold: this.config.thresholds.slowAiCallLimitMs,
                value: ai.averageLatencyMs
            });
        }

        // 4. Cost Check
        if (ai.totalCost >= this.config.thresholds.costLimitDollars) {
            this.emit("metrics:cost_threshold:exceeded", {
                operation: this.operationName,
                timestamp: new Date(),
                warning: `Total AI cost exceeded budget threshold: $${ai.totalCost.toFixed(4)}`,
                threshold: this.config.thresholds.costLimitDollars,
                value: ai.totalCost
            });
        }
    }

    private emit(event: string, payload: any): void {
        if (this.eventBus) {
            this.eventBus.publish(event as any, payload);
        }
    }
}
