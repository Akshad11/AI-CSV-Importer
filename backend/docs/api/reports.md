# Reports API

After an import completes, the reporting framework can export the results in multiple formats.

---

## Supported Report Formats

| Format | Content-Type | Description |
|:---|:---|:---|
| JSON | `application/json` | Full machine-readable report |
| CSV | `text/csv` | Tabular row-level export |
| Markdown | `text/markdown` | Human-readable summary |
| HTML | `text/html` | Browser-renderable styled report |

---

## Planned Endpoints

| Method | Path | Format |
|:---|:---|:---|
| `GET` | `/api/v1/importer/:importId/report` | JSON |
| `GET` | `/api/v1/importer/:importId/report/csv` | CSV download |
| `GET` | `/api/v1/importer/:importId/report/markdown` | Markdown |
| `GET` | `/api/v1/importer/:importId/report/html` | HTML download |

---

## JSON Report Structure

```typescript
import { ImportReport } from "./statistics"; // See statistics.md

// GET /api/v1/importer/:importId/report
interface ImportReportResponse {
  success: true;
  message: string;
  data: ImportReport;
  meta: Record<string, unknown>;
}
```

### Example JSON Report

```json
{
  "success": true,
  "message": "Report generated.",
  "data": {
    "importId": "abc-123",
    "timestamp": "2026-07-10T01:00:00.000Z",
    "summary": {
      "success": true,
      "durationMs": 4500,
      "totalRows": 1000,
      "processedRows": 1000,
      "successfulRows": 982,
      "failedRows": 18
    },
    "statistics": {
      "rows": {
        "total": 1000,
        "processed": 1000,
        "successful": 982,
        "failed": 18,
        "skipped": 0,
        "cancelled": 0
      },
      "retries": {
        "retryCount": 5,
        "retrySuccess": 3,
        "retryFailure": 2
      }
    },
    "performance": {
      "rowsPerSecond": 222.2,
      "executionTimeMs": 4500,
      "p50": 320,
      "p90": 890,
      "p99": 1450
    },
    "aiUsage": {
      "totalTokens": 250000,
      "promptTokens": 180000,
      "completionTokens": 70000,
      "callsCount": 50
    },
    "cost": {
      "totalCost": 0.0275,
      "costPerRow": 0.000028,
      "currency": "USD"
    }
  },
  "meta": {}
}
```

---

## HTML Report Sample Structure

The `HtmlReportExporter` generates a dark-mode themed HTML page with:

- **Import summary** (ID, status, duration)
- **Statistics grid** (total rows, successful, failed)
- **Performance table** (throughput, P50/P90/P99 latency)
- **AI Usage** (tokens, calls)
- **Cost Accounting** (total cost, cost per row)
- **Warnings** (if any thresholds were breached)
- **Recommendations** (optimization suggestions)

---

## Downloading a Report (Browser)

```typescript
async function downloadReport(importId: string, format: "csv" | "html" | "markdown") {
  const mimeMap = {
    csv: "text/csv",
    html: "text/html",
    markdown: "text/markdown",
  };

  const response = await fetch(
    `/api/v1/importer/${importId}/report/${format}`
  );
  const blob = await response.blob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `import-${importId}.${format === "markdown" ? "md" : format}`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## React: Report Download Button

```tsx
function ReportDownloadButtons({ importId }: { importId: string }) {
  const download = (format: "csv" | "html" | "markdown") =>
    downloadReport(importId, format);

  return (
    <div className="button-group">
      <button onClick={() => download("csv")}>Download CSV</button>
      <button onClick={() => download("html")}>Download HTML</button>
      <button onClick={() => download("markdown")}>Download Markdown</button>
    </div>
  );
}
```

---

## Report Exporters

The following exporters are implemented server-side:

| Exporter Class | Format | Output |
|:---|:---|:---|
| `JsonReportExporter` | JSON | Full structured report |
| `CsvReportExporter` | CSV | Summary table |
| `MarkdownReportExporter` | Markdown | Formatted text report |
| `HtmlReportExporter` | HTML | Styled browser report |
