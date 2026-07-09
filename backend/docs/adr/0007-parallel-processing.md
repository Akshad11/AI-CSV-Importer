# ADR 0007: Parallel Batch Processing Engine

## Title
Concurrent Queue-driven Parallel Processing Engine

## Status
Accepted

## Context
Our platform handles heavy data operations (such as streaming CSV parsing, schema validation, and AI provider transformations) involving thousands of batches. A linear, sequential execution model limits CPU utilization and throughput, while a simple `Promise.all` approach loads the entire dataset into memory, triggering Out Of Memory (OOM) crashes and downstream API rate limits. We need a resilient, streaming parallel processing engine that maintains a constant memory footprint, respects backpressure, enables dynamic concurrency controller, and integrates natively with our existing `RetryEngine` and `CancellationToken` components.

## Decision
We will implement an Enterprise Parallel Processing Engine under `src/core/parallel/`:
- **WorkerPool & Workers**: Allocate and manage the lifetimes of concurrent workers. Workers execute tasks using the generic `RetryEngine` and check cancellation signals.
- **BatchQueue**: Implement an asynchronous, priority-sorted task queue supporting watermark triggers.
- **Backpressure & Resource Monitor**: Throttle ingestion streams when queue watermarks or V8 heap capacities are hit, resuming when levels recover.
- **ParallelExecutor**: Orchestrate streaming input iteration, worker task scheduling, backpressure signals, and ordered or unordered output collation.

## Consequences
- **Pros**:
  - Constant memory usage regardless of input file size.
  - Fail-fast OOM prevention by monitoring Node heap usages.
  - Native EventBus integration for telemetry and execution statistics (throughput, utilization, failures).
- **Cons**:
  - High complexity in managing asynchronous races, queue locking, and ordered buffer maps.
  - Potential thread contention under high concurrency limits.

## Alternatives Considered
- **Unbounded Promise.all**: Map inputs directly to promises. Rejected because it buffers all datasets in memory, causing OOM issues.
- **Heavy External Streaming Packages**: Using packages like `RxJS` or `p-queue`. Rejected to maintain a clean codebase with minimal dependencies, and to ensure native compatibility with our DI container and CancellationToken patterns.
