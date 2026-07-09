import { ImportReport } from "../core/metrics/MetricsTypes";
import { ReportExporter } from "./ReportTypes";

export class HtmlReportExporter implements ReportExporter {
    /**
     * Translates the ImportReport into a beautifully styled responsive HTML page representation.
     */
    public exportReport(report: ImportReport): string {
        const warningsList = report.warnings.map((w) => `<li>⚠️ ${w}</li>`).join("");
        const recList = report.recommendations.map((r) => `<li>💡 ${r}</li>`).join("");

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Import Report: ${report.importId}</title>
    <style>
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            padding: 2rem;
            margin: 0;
        }
        .container {
            max-width: 900px;
            margin: auto;
            background: #1e293b;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
        }
        h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 1rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .card { background: #334155; padding: 1.5rem; border-radius: 8px; }
        .card h3 { margin-top: 0; color: #38bdf8; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #475569; }
        th { color: #94a3b8; }
        .warning { color: #facc15; }
        .recommendation { color: #4ade80; }
        ul { padding-left: 1.25rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Import Summary Report</h1>
        <p><strong>Import ID:</strong> ${report.importId}</p>
        <p><strong>Status:</strong> ${report.summary.success ? "SUCCESS" : "WARNINGS ENCOUNTERED"}</p>
        
        <div class="grid">
            <div class="card">
                <h3>Statistics</h3>
                <table>
                    <tr><td>Total Rows</td><td>${report.summary.totalRows}</td></tr>
                    <tr><td>Processed Rows</td><td>${report.summary.processedRows}</td></tr>
                    <tr><td>Successful Rows</td><td>${report.summary.successfulRows}</td></tr>
                    <tr><td>Failed Rows</td><td>${report.summary.failedRows}</td></tr>
                </table>
            </div>
            <div class="card">
                <h3>Performance</h3>
                <table>
                    <tr><td>Duration</td><td>${report.summary.durationMs}ms</td></tr>
                    <tr><td>Rows/Sec</td><td>${report.performance.rowsPerSecond}</td></tr>
                    <tr><td>P50 Latency</td><td>${report.performance.p50}ms</td></tr>
                    <tr><td>P99 Latency</td><td>${report.performance.p99}ms</td></tr>
                </table>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>AI Usage</h3>
                <table>
                    <tr><td>Total Tokens</td><td>${report.aiUsage.totalTokens}</td></tr>
                    <tr><td>Prompt Tokens</td><td>${report.aiUsage.promptTokens}</td></tr>
                    <tr><td>Completion Tokens</td><td>${report.aiUsage.completionTokens}</td></tr>
                </table>
            </div>
            <div class="card">
                <h3>Cost Accounting</h3>
                <table>
                    <tr><td>Total Cost</td><td>$${report.cost.totalCost.toFixed(4)}</td></tr>
                    <tr><td>Cost per Row</td><td>$${report.cost.costPerRow.toFixed(6)}</td></tr>
                    <tr><td>Est. Monthly Cost</td><td>$${report.cost.projectedMonthlyCost.toFixed(2)}</td></tr>
                </table>
            </div>
        </div>

        ${report.warnings.length > 0 ? `
        <div class="card warning" style="margin-top: 1.5rem;">
            <h3>Warnings</h3>
            <ul>${warningsList}</ul>
        </div>` : ""}

        ${report.recommendations.length > 0 ? `
        <div class="card recommendation" style="margin-top: 1.5rem;">
            <h3>Recommendations</h3>
            <ul>${recList}</ul>
        </div>` : ""}
    </div>
</body>
</html>`;
    }
}
