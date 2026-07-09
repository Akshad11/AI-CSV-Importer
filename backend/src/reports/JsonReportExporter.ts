import { ImportReport } from "../core/metrics/MetricsTypes";
import { ReportExporter } from "./ReportTypes";

export class JsonReportExporter implements ReportExporter {
    /**
     * Serializes the ImportReport as pretty JSON.
     */
    public exportReport(report: ImportReport): string {
        return JSON.stringify(report, null, 2);
    }
}
