import { ImportReport } from "../core/metrics/MetricsTypes";
import { ReportExporter } from "./ReportTypes";

export class MarkdownReportExporter implements ReportExporter {
    /**
     * Translates the ImportReport into a beautifully formatted Markdown document.
     */
    public exportReport(report: ImportReport): string {
        const warningLines = report.warnings.map((w) => `- ⚠️ ${w}`).join("\n");
        const recLines = report.recommendations.map((r) => `- 💡 ${r}`).join("\n");

        return `# Import Operational Execution Report

## Overview
- **Import ID**: \`${report.importId}\`
- **Execution Timestamp**: ${report.timestamp.toISOString()}
- **Success Status**: ${report.summary.success ? "✅ SUCCESS" : "❌ FAILURE"}
- **Duration**: \`${report.summary.durationMs}ms\`

## Statistics Summary
| Metric | Count |
| :--- | :--- |
| **Total Rows** | ${report.summary.totalRows} |
| **Processed Rows** | ${report.summary.processedRows} |
| **Successful Rows** | ${report.summary.successfulRows} |
| **Failed Rows** | ${report.summary.failedRows} |

## Performance & Throughput
- **Rows / Second**: \`${report.performance.rowsPerSecond}\`
- **Batches / Second**: \`${report.performance.batchesPerSecond}\`
- **Latency Percentiles**:
  - P50 (Median): \`${report.performance.p50}ms\`
  - P90: \`${report.performance.p90}ms\`
  - P99: \`${report.performance.p99}ms\`

## Cost & Token Accounting
- **Total Accrued Cost**: \`$${report.cost.totalCost.toFixed(4)}\`
- **Projected Monthly Runrate**: \`$${report.cost.projectedMonthlyCost.toFixed(2)}\`
- **Total Token Consumption**: \`${report.aiUsage.totalTokens}\` (Prompt: \`${report.aiUsage.promptTokens}\`, Completion: \`${report.aiUsage.completionTokens}\`)

${report.warnings.length > 0 ? `## Warnings\n${warningLines}\n` : ""}
${report.recommendations.length > 0 ? `## Recommendations\n${recLines}\n` : ""}
`;
    }
}
