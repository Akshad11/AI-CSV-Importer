# ADR 0003: Import Context State Management

## Title
Unified ImportContext Object for Pipeline Stages

## Status
Accepted

## Context
As an import runs through stages (e.g., CSV Parsing -> Batching -> AI Enrichment -> DB Insert), it accumulates metadata, statistics, configuration state, logger hooks, event buses, and cancellation controls. Passing these as separate primitive parameters to functions/classes results in long, brittle method signatures.

## Decision
We will define a single, strongly-typed `ImportContext` class instance.
- This context will carry all state: Import ID, File Details, Progress, Metadata, Statistics, logger, event bus, and cancellation token.
- Every pipeline stage will accept **only** the `ImportContext` as its parameter.
- The context itself will be mutable for statistics and progress updating, but internal references to core dependencies (like the event bus, cancellation token) will be read-only (immutable).

## Consequences
- **Pros**: Clean pipeline stage signature `execute(context: ImportContext): Promise<ImportResult>`, high extensibility (adding metadata or stats does not break stage signatures), central tracking of state.
- **Cons**: High cohesion of state can sometimes make the context object a large data carrier, requiring strict boundaries to prevent it from becoming a "God object" containing business logic.

## Alternatives Considered
- **Stateful Stages**: Each stage maintaining its own state. Rejected because it makes coordination, progress reporting, and recovery of the entire import pipeline extremely complex.
- **Contextual Database Polling**: Loading state from DB in every stage. Rejected due to performance overhead and unnecessary database coupling for temporary processing state.
