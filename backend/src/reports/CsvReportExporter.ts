import { ImportReport } from "../core/metrics/MetricsTypes";
import { ReportExporter } from "./ReportTypes";

export class CsvReportExporter implements ReportExporter {
    /**
     * Flattens summary metrics into tabular CSV key-value lines.
     */
    public exportReport(report: ImportReport): string {
        const rows = [
            ["Metric Name", "Value"],
            ["Import ID", report.importId],
            ["Success Status", report.summary.success ? "SUCCESS" : "FAILURE"],
            ["Duration (ms)", report.summary.durationMs.toString()],
            ["Total Rows", report.summary.totalRows.toString()],
            ["Processed Rows", report.summary.processedRows.toString()],
            ["Successful Rows", report.summary.successfulRows.toString()],
            ["Failed Rows", report.summary.failedRows.toString()],
            ["Total Tokens", report.aiUsage.totalTokens.toString()],
            ["Prompt Tokens", report.aiUsage.promptTokens.toString()],
            ["Completion Tokens", report.aiUsage.completionTokens.toString()],
            ["Total Cost ($)", report.cost.totalCost.toString()],
            ["Cost Per Row ($)", report.cost.costPerRow.toString()],
            ["Cost Per Batch ($)", report.cost.costPerBatch.toString()],
            ["Projected Monthly Cost ($)", report.cost.projectedMonthlyCost.toString()]
        ];

        return rows
            .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
            .join("\n");
    }
}
