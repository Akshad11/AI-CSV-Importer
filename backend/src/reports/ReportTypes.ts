import { ImportReport } from "../core/metrics/MetricsTypes";

export interface ReportExporter {
    /**
     * Exports a compiled ImportReport into a specific string format representation.
     */
    exportReport(report: ImportReport): string;
}
