# Statistics & Metrics Reference

The statistics framework captures detailed metrics for every import. This data is accessible through the report payload after an import completes.

---

## TypeScript: Complete Statistics Interfaces

```typescript
// Row-level statistics
interface RowStatistics {
  total: number;         // All rows in the CSV (excluding header)
  processed: number;     // Rows attempted for processing
  successful: number;    // Rows successfully processed by AI
  failed: number;        // Rows that failed after all retries
  skipped: number;       // Rows skipped (empty lines, etc.)
  cancelled: number;     // Rows not processed due to cancellation
}

// Retry statistics
interface RetryStatistics {
  retryCount: number;    // Total retry attempts across all batches
  retrySuccess: number;  // Retries that eventually succeeded
  retryFailure: number;  // Retries that ultimately failed
}

// AI provider usage statistics
interface AIStatistics {
  provider: string;              // e.g. "openai", "gemini", "mock"
  model: string;                 // e.g. "gpt-4o", "gemini-1.5-flash"
  promptTokens: number;          // Total input tokens sent
  completionTokens: number;      // Total output tokens received
  cachedTokens: number;          // Tokens served from cache (cost saving)
  reasoningTokens: number;       // Tokens used for chain-of-thought reasoning
  totalTokens: number;           // promptTokens + completionTokens
  promptSizeBytes: number;       // Raw prompt payload size in bytes
  responseSizeBytes: number;     // Raw response payload size in bytes
  averageLatencyMs: number;      // Mean provider response time
  fastestLatencyMs: number;      // Best provider response time
  slowestLatencyMs: number;      // Worst provider response time
  retries: number;               // Provider-level retries
  failures: number;              // Unrecoverable provider failures
  timeouts: number;              // Requests that exceeded timeout
  estimatedCost: number;         // USD — based on model pricing
  actualCost: number;            // USD — actual billed cost if available
  costPerRow: number;            // USD per CSV row processed
  costPerBatch: number;          // USD per batch
}

// System performance metrics
interface PerformanceMetrics {
  rowsPerSecond: number;         // Processing throughput
  batchesPerSecond: number;      // Batch throughput
  tokensPerSecond: number;       // AI token generation rate
  averageThroughput: number;     // Avg rows/sec across the run
  peakThroughput: number;        // Max rows/sec observed
  workerUtilization: number;     // 0.0–1.0, fraction of worker capacity used
  queueUtilization: number;      // 0.0–1.0, fraction of queue capacity used
  memoryUsedBytes: number;       // Heap memory consumed
  memoryLimitBytes: number;      // Configured memory limit
  cpuPercentage: number;         // CPU utilization (0–100)
  executionTimeMs: number;       // Total wall-clock time
  p50: number;                   // 50th percentile batch latency (ms)
  p90: number;                   // 90th percentile batch latency (ms)
  p95: number;                   // 95th percentile batch latency (ms)
  p99: number;                   // 99th percentile batch latency (ms)
}

// Error breakdown
interface ErrorProfile {
  type: string;
  message: string;
  stage: string;
  provider?: string;
  batchIndex?: number;
  timestamp: string;             // ISO 8601
  frequency: number;
}

interface ErrorSummary {
  validationErrors: number;
  providerErrors: number;
  retryErrors: number;
  timeouts: number;
  cancellations: number;
  csvErrors: number;
  batchErrors: number;
  jsonErrors: number;
  unknownErrors: number;
  profiles: ErrorProfile[];
}

// Individual batch performance record
interface BatchMetrics {
  batchIndex: number;
  batchSize: number;
  durationMs: number;
  queueDelayMs: number;          // Time spent waiting in queue
  processingDelayMs: number;     // Time spent in active processing
  success: boolean;
  retries: number;
  failures: number;
}

// AI Usage summary (from MetricsCollector)
interface AIUsageSummary {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  callsCount: number;
  byModel: Record<string, {
    calls: number;
    tokens: number;
    cost: number;
  }>;
}

// Cost accounting
interface CostAccounting {
  totalCost: number;             // USD total for this import
  costPerRow: number;            // USD per successfully processed row
  costPerBatch: number;          // USD per batch
  estimatedSavings: number;      // USD saved via caching
  currency: string;              // Always "USD" in v1
}

// Full import report
interface ImportReport {
  importId: string;
  timestamp: string;             // ISO 8601 when report was generated
  summary: {
    success: boolean;
    durationMs: number;
    totalRows: number;
    processedRows: number;
    successfulRows: number;
    failedRows: number;
  };
  statistics: {
    rows: RowStatistics;
    retries: RetryStatistics;
  };
  performance: PerformanceMetrics;
  errors: ErrorSummary;
  aiUsage: AIUsageSummary;
  cost: CostAccounting;
}
```

---

## Statistics Field Reference

### Row Statistics

| Field | Type | Description |
|:---|:---|:---|
| `total` | `number` | Total rows in the CSV file (header excluded) |
| `processed` | `number` | Rows attempted for AI processing |
| `successful` | `number` | Rows that produced a valid AI response |
| `failed` | `number` | Rows that failed after exhausting retries |
| `skipped` | `number` | Rows skipped (blank, duplicate-detected) |
| `cancelled` | `number` | Rows not reached due to cancellation |

### Performance Metrics

| Field | Type | Unit | Description |
|:---|:---|:---|:---|
| `rowsPerSecond` | `number` | rows/s | Import throughput |
| `p50` | `number` | ms | Median batch latency |
| `p90` | `number` | ms | 90th percentile batch latency |
| `p99` | `number` | ms | 99th percentile batch latency |
| `workerUtilization` | `number` | 0.0–1.0 | How busy workers were |
| `memoryUsedBytes` | `number` | bytes | Heap used during import |
| `executionTimeMs` | `number` | ms | Total wall-clock duration |

### AI Statistics

| Field | Type | Unit | Description |
|:---|:---|:---|:---|
| `totalTokens` | `number` | tokens | All tokens consumed |
| `estimatedCost` | `number` | USD | Calculated from model pricing |
| `averageLatencyMs` | `number` | ms | Mean time per AI request |
| `retries` | `number` | — | AI-level retries triggered |
| `timeouts` | `number` | — | Requests that timed out |

### Cost Accounting

| Field | Type | Description |
|:---|:---|:---|
| `totalCost` | USD | Total import cost |
| `costPerRow` | USD | Cost efficiency metric |
| `estimatedSavings` | USD | Saved via prompt caching |

---

## Displaying Statistics in React

```tsx
function ImportSummaryCard({ report }: { report: ImportReport }) {
  const successRate =
    report.summary.totalRows > 0
      ? ((report.statistics.rows.successful / report.summary.totalRows) * 100).toFixed(1)
      : "0";

  return (
    <div className="card">
      <h2>Import Summary</h2>
      <dl>
        <dt>Total Rows</dt>     <dd>{report.summary.totalRows.toLocaleString()}</dd>
        <dt>Successful</dt>     <dd>{report.statistics.rows.successful.toLocaleString()}</dd>
        <dt>Failed</dt>         <dd>{report.statistics.rows.failed.toLocaleString()}</dd>
        <dt>Success Rate</dt>   <dd>{successRate}%</dd>
        <dt>Duration</dt>       <dd>{(report.summary.durationMs / 1000).toFixed(2)}s</dd>
        <dt>Throughput</dt>     <dd>{report.performance.rowsPerSecond.toFixed(0)} rows/s</dd>
        <dt>AI Tokens</dt>      <dd>{report.aiUsage.totalTokens.toLocaleString()}</dd>
        <dt>Total Cost</dt>     <dd>${report.cost.totalCost.toFixed(4)}</dd>
      </dl>
    </div>
  );
}
```
