import { describe, expect, it } from "vitest";
import { MetricsCollector } from "../../src/core/metrics/MetricsCollector";
import { ImportReportBuilder } from "../../src/core/metrics/ImportReportBuilder";
import { HtmlReportExporter } from "../../src/reports/HtmlReportExporter";

describe("Reporting E2E Test", () => {
    it("successfully compiles and exports execution metrics into HTML", () => {
        const collector = new MetricsCollector();
        collector.start();

        collector.updateStats((s) => {
            s.setTotalRows(1500);
            s.incrementProcessed(1500);
            s.incrementSuccessful(1480);
            s.incrementFailed(20);
        });

        collector.recordCall({
            provider: "openai",
            model: "gemini-1.5-flash",
            promptTokens: 45000,
            completionTokens: 25000,
            latencyMs: 850,
            success: true
        });

        const builder = new ImportReportBuilder();
        const report = builder.buildReport("import-e2e-report", collector);

        const html = new HtmlReportExporter().exportReport(report);
        // Verify the HTML export contains the import ID and key metric values
        expect(html).toContain("import-e2e-report");
        expect(html).toContain("1500");    // total rows rendered in the stats table
        expect(html).toContain("1480");    // successful rows rendered
        expect(html).toContain("70000");   // total tokens rendered
    });
});
