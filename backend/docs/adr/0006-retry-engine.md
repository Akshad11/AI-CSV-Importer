# ADR 0006: Reusable Enterprise Retry Engine

## Title
Enterprise Retry Engine and Circuit Breaker Resilience Framework

## Status
Accepted

## Context
Our application performs high-scale, asynchronous operations including external AI API queries, local file system IO, database interactions, and event propagation. Transient network failures, downstream rate limits (429s), and service timeouts (503s) are inevitable. Hardcoding ad-hoc retry loops inside individual service classes couples business logic to execution loops, violates the DRY principle, and obscures runtime diagnostics. We need a highly reusable, decoupled resilience framework supporting configurable progression backoffs, decorrelated jitter, circuit breaker state machines, timeouts, cancellation, and detailed execution telemetry.

## Decision
We will implement a generic, reusable Enterprise Retry Engine under `src/core/retry/`:
- **RetryEngine & RetryExecutor**: Execute arbitrary async callbacks using composition and selectable options.
- **DelayStrategy**: Compute backoff durations incorporating constant, linear, exponential, and AWS Decorrelated Jitter.
- **RetryClassifier**: Separate retryable errors (network issues, 429s, 5xxs) from fatal faults (4xx validation, syntax errors, authorization failures) to prevent thundering herds and useless API consumption.
- **CircuitBreaker**: Implement a resilient state machine (Closed, Open, HalfOpen) blocking operations during downstream outages to allow recovery.
- **Telemetry**: Propagate rich retry events (e.g. `retry:attempt`, `circuit:opened`) to the EventBus and track execution statistics (attempts, average duration, cumulative backoff time).

## Consequences
- **Pros**:
  - Decoupled, reusable design suitable for any async database, HTTP, storage, queue, or AI provider task.
  - Reduced API rate limiting penalties using decorrelated jitter to avoid synchronized retry storms.
  - Fail-fast protection via circuit breakers during sustained downstream outages.
  - Rich telemetry enables precise profiling and analytics.
- **Cons**:
  - Higher code complexity to manage generic types and execution contexts.
  - Overhead of maintaining async timers and event dispatch loops.

## Alternatives Considered
- **Coupled Provider Retries**: Embedding backoff code directly inside individual provider adapters (e.g., `openai.provider.ts`). Rejected because it violates DRY and leaves database and filesystem IO unprotected.
- **Heavy External Resilience Libraries**: Utilizing a package like `PollyJS`. Rejected to maintain a lightweight, zero-dependency codebase, and to achieve native compliance with our custom EventBus and `CancellationToken` interfaces.
