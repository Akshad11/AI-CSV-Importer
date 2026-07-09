# ADR 0001: Dependency Injection Container

## Title
Lightweight, Custom Dependency Injection (DI) Container

## Status
Accepted

## Context
The application requires managing service lifecycles (singletons vs transients) and resolving dependencies across modules (such as CSV parsers, AI providers, validator services, and executors). We want to avoid circular dependencies and ensure clean testing setups. However, external DI libraries often rely on heavy reflection APIs or experimental TypeScript decorators, which can impact performance, bundle sizes, or compatibility with standard build tools (such as tsx or vitest).

## Decision
We will build a custom, lightweight Dependency Injection (DI) container in TypeScript. 
- It will support registering singleton and transient services.
- Resolution will support circular dependency detection via a call stack guard.
- To inject dependencies without decorator reflection, classes will expose a static `static inject = [...]` array of dependency string/token names.
- Services will be registered using descriptive names (tokens).

## Consequences
- **Pros**: Clean architecture, zero external dependencies, extremely fast resolution, explicit dependency mapping, circular dependency detection at startup/resolution, simple testing mocks.
- **Cons**: Constructor injection requires defining the static `inject` list manually for each class.

## Alternatives Considered
- **tsyringe / InversifyJS**: Rejected because they require experimental decorators and `reflect-metadata`, which complicate the compilation chain and cause issues with ESM builds.
- **Manual Construction (Poor Man's DI)**: Rejected because it does not scale well as the number of modules grows, leading to complex startup files and difficult configuration management.
