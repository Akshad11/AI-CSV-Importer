import { ImportReport } from "./MetricsTypes";
import { MetricsCollector } from "./MetricsCollector";
import { CostCalculator } from "./CostCalculator";

export class ImportReportBuilder {
    private readonly costCalculator = new CostCalculator();

    /**
     * Aggregates collected telemetry statistics into a fully compiled ImportReport.
     */
    public buildReport(importId: string, collector: MetricsCollector): ImportReport {
        const rows = collector.statsCollector.getRowStatistics();
        const retries = collector.statsCollector.getRetryStatistics();
        const ai = collector.aiAnalytics.getAISummary();
        const errors = collector.errorAnalytics.getErrorSummary();
        const perf = collector.collectPerformance();
        const batches = collector.batchAnalytics.getBatchSummary();

        const duration = perf.executionTimeMs;
        const totalRows = rows.total;

        const costPerRow = totalRows > 0 ? parseFloat((ai.totalCost / totalRows).toFixed(6)) : 0;
        const costPerBatch =
            batches.averageDuration > 0
                ? parseFloat((ai.totalCost / (collector.batchAnalytics.getBatches().length || 1)).toFixed(6))
                : 0;

        const activeModel = collector.aiAnalytics.getLogs()[0]?.model || "gemini-1.5-flash";
        const prompt = ai.promptTokens;
        const completion = ai.completionTokens;
        const estimatedSavings = this.costCalculator.calculateEstimatedSavings(
            activeModel,
            "gpt-4o",
            prompt,
            completion
        );

        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Evaluate validation warning limits
        if (rows.failed > 0 && rows.processed > 0) {
            const failRate = rows.failed / rows.processed;
            if (failRate > 0.1) {
                warnings.push(
                    `High row failure rate detected: ${(failRate * 100).toFixed(1)}% of rows failed validation.`
                );
                recommendations.push(
                    "Check the reported JSON schema errors below to verify if incoming CSV headers fit database columns."
                );
            }
        }

        // Evaluate transient retry warnings
        if (retries.retryCount > 0 && rows.processed > 0) {
            const retryRate = retries.retryCount / rows.processed;
            if (retryRate > 0.2) {
                warnings.push(
                    `Frequent provider retry handshakes: average retry rate is ${(retryRate * 100).toFixed(1)}%.`
                );
                recommendations.push(
                    "Switch concurrent workers scaling to lower limits to avoid triggering API provider rate limitations."
                );
            }
        }

        // Evaluate cost suggestions
        if (ai.totalCost > 1.0) {
            recommendations.push(
                "Consider replacing OpenAI model bindings with Gemini Flash to reduce processing prompt cost tiers by up to 80%."
            );
        }

        return {
            importId,
            timestamp: new Date(),
            summary: {
                success: errors.profiles.length === 0,
                durationMs: duration,
                totalRows: rows.total,
                processedRows: rows.processed,
                successfulRows: rows.successful,
                failedRows: rows.failed
            },
            statistics: {
                rows,
                retries
            },
            performance: perf as any,
            errors,
            aiUsage: {
                totalTokens: ai.totalTokens,
                promptTokens: ai.promptTokens,
                completionTokens: ai.completionTokens,
                cachedTokens: ai.cachedTokens,
                reasoningTokens: ai.reasoningTokens,
                callsCount: ai.callsCount,
                byModel: ai.byModel
            },
            cost: {
                totalCost: ai.totalCost,
                costPerRow,
                costPerBatch,
                estimatedSavings,
                projectedMonthlyCost: this.costCalculator.projectMonthlyCost(ai.totalCost, duration)
            },
            timeline: [
                { stage: "Ingestion & Parse", timestamp: new Date(Date.now() - duration), durationMs: duration * 0.15 },
                { stage: "AI Inference & Write", timestamp: new Date(), durationMs: duration * 0.85 }
            ],
            configuration: {
                metricsEnabled: true,
                costTracking: true,
                performanceTracking: true
            },
            warnings,
            recommendations
        };
    }
}
