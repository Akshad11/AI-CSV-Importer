# ADR 0009: Enterprise Testing Strategy

## Title
Testing Trophy: Multi-Layer Testing Strategy for the AI Import Platform

## Status
Accepted

## Context

The AI Import Platform processes millions of CSV rows through a multi-stage pipeline: CSV parsing → batch engine → parallel workers → AI providers → validation → metrics → reporting. Each stage has different failure modes (timeouts, rate-limits, validation errors, cancellation races, memory pressure) that require different test strategies to surface. We need a comprehensive testing strategy that detects regressions quickly, validates all provider contracts, enables CI/CD gates, and provides deterministic coverage.

## Decision

We implement a full **Testing Trophy** approach with these layers:

### 1. Unit Tests (`tests/unit/`)
- Fastest feedback loop.
- Cover isolated domain logic: calculators, parsers, validators, builders.
- 100% mocked dependencies. No I/O.

### 2. Integration Tests (`tests/integration/`)
- Use real implementations except external providers.
- Validate component composition: DI Container, EventBus wiring, MetricsCollector threshold alerts.

### 3. Contract Tests (`tests/contract/`)
- Every AI provider must satisfy the same `IAIProvider` interface.
- `generate()`, `stream()`, `health()`, `getModelInformation()` are verified for all providers including Mock, OpenAI, Gemini, Claude, Azure, Ollama.
- Report exporters verified against the `ReportExporter` contract.
- Workers verified against state progression and statistics shape.

### 4. End-to-End Tests (`tests/e2e/`)
- Real HTTP layer via `supertest`.
- Upload, status, retry recovery, cancellation aborts, metrics threshold alerting, HTML report exports.
- AI provider calls remain mocked. All other infrastructure is real.

### 5. Performance Tests (`tests/performance/`)
- **Throughput**: Minimum 2,000 rows/sec on parallel executor.
- **Latency**: P50/P90/P99 computation overhead < 1ms for 1,000 samples.
- **Memory**: < 50MB heap growth across 50,000 metrics recordings.
- **Parallel**: Concurrency=8 delivers ≥ 4× speedup vs concurrency=1.
- **Stress**: 1,000 sequential mock AI calls complete within 5 seconds.

### 6. Test Infrastructure
- **Builders** (fluent, AAA-friendly): `ImportContextBuilder`, `BatchBuilder`, `CsvRowBuilder`, `AIResponseBuilder`, `MetricsBuilder`.
- **Mocks**: `MockAIProvider`, `MockEventBus`, `MockRetryEngine`, `MockLogger`, `MockWorkerPool`.
- **Utilities**: `TestServer` (local HTTP server), `CsvGenerator`, `FakeClock`, `TestHelpers`.
- **CSV Fixtures**: `empty`, `valid`, `invalid`, `malformed`, `duplicate`, `unicode`, `million-rows`.

### 7. CI/CD Modes
```bash
# Fast feedback (unit + integration)
npm run test:run

# Full suite including E2E and performance
npm run test:run

# Coverage with thresholds
npm run test:coverage
```

## Consequences

### Pros
- Any regression in provider contracts, retry logic, or metrics publishing is caught before merge.
- Builders eliminate boilerplate and make test intent clear.
- Contract tests allow provider swaps (e.g. OpenAI → Gemini) without silent breakage.
- Performance tests catch throughput regressions introduced by framework changes.

### Cons
- E2E tests require the Express app to be import-safe (no side effects on module load).
- Performance assertions may be flaky on resource-constrained CI agents; timeouts should be generous.

## Alternatives Considered
- **Playwright for E2E**: Rejected because no browser UI exists; API-level supertest tests are sufficient and faster.
- **k6 for load testing**: Considered for future integration; current performance tests in Vitest are sufficient for CI gates.
