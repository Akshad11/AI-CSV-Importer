# ADR 0005: AI Provider Resolution

## Title
Configuration-driven AI Provider Resolution

## Status
Accepted

## Context
Our application supports multiple AI providers (OpenAI, Gemini, Claude, and Mock). Hardcoding the provider initialization or using conditional blocks (`switch` statements) in orchestrators or pipeline stages violates the Open-Closed Principle (OCP) and limits reusability. We need a way to resolve the provider dynamically based on environment configuration or parameter contexts.

## Decision
We will introduce an `AIProviderResolver` class implementing the `IAIProviderResolver` interface.
- It will read from configuration objects (e.g. `ai.config.ts`, which maps environment variables like `AI_PROVIDER`, `AI_MODEL`, etc.).
- It will interact with the Dependency Injection Container to resolve provider instances by name.
- It will be completely decoupled from concrete provider implementation details.

## Consequences
- **Pros**: Dynamic selection, high configuration flexibility, mockable providers in unit testing, strict adherence to DIP (Dependency Inversion Principle).
- **Cons**: Requires mapping names carefully to registered providers in the DI container.

## Alternatives Considered
- **Direct Switch Statements in Pipeline**: Switch checks for provider type in the executor stage. Rejected because adding a new provider requires editing the core stage execution logic.
- **Factory inside provider classes**: Static factory inside the base provider class. Rejected because it couples the abstract provider interfaces with concrete instantiations.
