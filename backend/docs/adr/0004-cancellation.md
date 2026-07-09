# ADR 0004: Cooperative Cancellation Support

## Title
CancellationToken-based Cooperative Cancellation

## Status
Accepted

## Context
Long-running import processing jobs (e.g., thousands of rows batched and sent to AI APIs) must be cancellable at any point by the user or due to system timeouts. Node.js does not support preemptively killing threads or execution frames safely, so cooperative cancellation is necessary.

## Decision
We will design a `CancellationToken` pattern.
- The context will hold a `CancellationToken` instance.
- Stages must periodically check the token via `token.throwIfCancelled()`, particularly between processing batches or rows.
- The token will support registering callbacks to handle cleanup actions (such as closing file descriptors or releasing locks) as soon as cancellation is triggered.
- A custom `CancellationError` class will be thrown to safely halt execution and allow the orchestrator to mark the import as "Cancelled" instead of "Failed".

## Consequences
- **Pros**: Clean resource cleanup, predictable flow control, graceful termination of long operations.
- **Cons**: Requires pipeline developers to manually include `throwIfCancelled()` checks at suitable loop boundaries.

## Alternatives Considered
- **Process Aborting**: Calling `process.exit()` or terminating worker threads. Rejected because it drops database connections, fails to run cleanups, and impacts other active import jobs.
- **Promise Aborting (External wrapper)**: Rejected because simply ignoring unresolved promises leaks memory and runs active requests to completion anyway.
