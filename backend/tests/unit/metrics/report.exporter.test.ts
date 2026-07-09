import { describe, expect, it } from "vitest";
import { ImportReportBuilder } from "../../../src/core/metrics/ImportReportBuilder";
import { MetricsCollector } from "../../../src/core/metrics/MetricsCollector";
import { JsonReportExporter } from "../../../src/reports/JsonReportExporter";
import { CsvReportExporter } from "../../../src/reports/CsvReportExporter";
import { MarkdownReportExporter } from "../../../src/reports/MarkdownReportExporter";
import { HtmlReportExporter } from "../../../src/reports/HtmlReportExporter";

describe("Report Exporters Unit Tests", () => {
    it("formats reports to JSON, CSV, Markdown, and HTML configurations correctly", () => {
        const collector = new MetricsCollector();
        collector.start();

        collector.updateStats((s) => {
            s.setTotalRows(10);
            s.incrementProcessed(10);
            s.incrementSuccessful(8);
            s.incrementFailed(2);
        });

        collector.recordCall({
            provider: "openai",
            model: "gpt-4o",
            promptTokens: 500,
            completionTokens: 200,
            latencyMs: 1500,
            success: true
        });

        const builder = new ImportReportBuilder();
        const report = builder.buildReport("imp-123", collector);

        // JSON Exporter
        const json = new JsonReportExporter().exportReport(report);
        expect(json).toContain("imp-123");
        expect(JSON.parse(json).importId).toBe("imp-123");

        // CSV Exporter
        const csv = new CsvReportExporter().exportReport(report);
        expect(csv).toContain("Import ID");
        expect(csv).toContain("imp-123");

        // Markdown Exporter
        const md = new MarkdownReportExporter().exportReport(report);
        expect(md).toContain("# Import Operational Execution Report");
        expect(md).toContain("imp-123");

        // HTML Exporter
        const html = new HtmlReportExporter().exportReport(report);
        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain("imp-123");
    });
});
