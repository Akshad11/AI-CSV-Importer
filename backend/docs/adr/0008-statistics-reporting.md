# ADR 0008: Enterprise Statistics, Metrics & Reporting Framework

## Title
Granular Multi-Collector Reporting and Telemetry Framework

## Status
Accepted

## Context
Our data processing engine processes millions of CSV import rows and makes concurrent calls to AI provider APIs. Without a robust metrics system, we cannot determine execution speeds, audit prompt token usage, flag bottlenecks (like slow API models), analyze error distributions, or track billing costs. We need an operational reporting framework that works in a decoupled fashion, supports multi-format exporters (JSON, CSV, MD, HTML), warns developers when system thresholds are exceeded, and allows future integration with OpenTelemetry and Grafana.

## Decision
We will implement an Enterprise Statistics, Metrics & Reporting Framework under `src/core/metrics/` and report generators under `src/reports/`:
- **Granular Collectors**: Separate collectors for row statistics, batch executions, error classes, performance usage, and AI provider calls.
- **Cost Calculator**: Models prompt and completion pricing dynamically to compute active cost, project monthly rates, and estimate savings.
- **Pluggable Exporters**: Export reports to JSON, CSV, Markdown, and HTML, keeping report formatting concerns completely decoupled from metric collectors.
- **Telemetry Events**: Emit status warning events via EventBus (`metrics:high_memory:warning`, etc.) when thresholds are breached.

## Consequences
- **Pros**:
  - Zero coupling between raw metrics tracking and reporting layout styles.
  - Transparent pricing audits, enabling provider cost-saving suggestions (e.g. recommending Gemini Flash over GPT-4).
  - Pluggable endpoints, allowing developers to route snapshots to Datadog or Prometheus.
- **Cons**:
  - Sorting logic for latency arrays to compute P50/P90/P99 percentiles adds slight runtime memory overhead.

## Alternatives Considered
- **Direct Grafana/Datadog SDK integration**: Track metrics directly using proprietary third-party libraries. Rejected because we must operate inside private customer cloud instances without leaking raw validation data, and pricing calculators require local model mappings.
