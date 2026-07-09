import { describe, expect, it } from "vitest";
import { ReportExporter } from "../../src/reports/ReportTypes";
import { JsonReportExporter } from "../../src/reports/JsonReportExporter";
import { CsvReportExporter } from "../../src/reports/CsvReportExporter";
import { MarkdownReportExporter } from "../../src/reports/MarkdownReportExporter";
import { HtmlReportExporter } from "../../src/reports/HtmlReportExporter";
import { MetricsBuilder } from "../builders/MetricsBuilder";

const exporters: { name: string; exporter: ReportExporter }[] = [
    { name: "JSON", exporter: new JsonReportExporter() },
    { name: "CSV", exporter: new CsvReportExporter() },
    { name: "Markdown", exporter: new MarkdownReportExporter() },
    { name: "HTML", exporter: new HtmlReportExporter() }
];

describe("Metrics Exporter Contract Verification Tests", () => {
    const report = new MetricsBuilder().withImportId("contract-test-id").build();

    exporters.forEach(({ name, exporter }) => {
        it(`ensures ${name} exporter satisfies the common contract returning formatted string`, () => {
            const output = exporter.exportReport(report);
            expect(typeof output).toBe("string");
            expect(output.length).toBeGreaterThan(0);
            expect(output).toContain("contract-test-id");
        });
    });
});
