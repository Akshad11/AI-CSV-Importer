# ADR 0002: Event Bus for Import Pipelines

## Title
In-Memory, Strongly-Typed Event Bus

## Status
Accepted

## Context
Import pipelines consist of multiple decoupled stages (e.g., parsing, batching, AI resolution, database insertion). Stages need to notify progress, record metrics, and log details without being tightly coupled to the reporting or logging components.

## Decision
We will implement a custom, strongly-typed `EventBus` to handle event publishing and subscribing in-memory.
- Each event will inherit from `IEvent` and define its payload type explicitly.
- The `EventBus` will support standard subscriptions, one-time subscriptions (`once`), asynchronous event handlers, and unsubscribe functions.
- To prevent one listener's failure from stopping the whole pipeline, error isolation will be implemented: if an event handler throws an error, it is caught, logged, and other listeners are still invoked.

## Consequences
- **Pros**: Clean separation of concerns, easy telemetry injection, testability of decoupled parts, pipeline progress reporting is completely out-of-band.
- **Cons**: Overuse of events can make the flow of execution harder to trace sequentially.

## Alternatives Considered
- **NodeJS EventEmitter**: Rejected because it is not strongly typed out of the box and does not provide built-in async listener error isolation.
- **RxJS**: Rejected to avoid adding external dependencies and complex reactive streams, when standard event subscriptions are sufficient.
