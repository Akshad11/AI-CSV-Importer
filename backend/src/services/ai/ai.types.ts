import { ZodType } from "zod";

export interface AIRequest {
    system: string;
    user: string;
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    responseSchema?: any; // Zod schema for structured output validation
    responseSchemaName?: string;  // Name of schema for structured output (e.g. "leads")
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    cachedTokens?: number;
    reasoningTokens?: number;
    totalTokens: number;
    estimatedCost?: number; // Estimated cost in USD
    providerCost?: number;  // Cost calculation direct from provider usage
}

export interface AIResponse<T = unknown> {
    success: boolean;
    provider: string;
    model: string;
    data: T;
    usage?: TokenUsage;
    latencyMs?: number;
}

export interface AIStreamChunk {
    text: string;
    usage?: TokenUsage;
    isLast: boolean;
}

export interface AIProviderHealth {
    available: boolean;
    latencyMs?: number;
    version?: string;
    model?: string;
    configured: boolean;
    authenticated: boolean;
    error?: string;
}

export interface ModelInformation {
    name: string;
    contextWindow: number;
    maxOutputTokens: number;
    costPer1kPrompt: number;     // USD
    costPer1kCompletion: number; // USD
    supportsStructuredOutput: boolean;
    supportsStreaming: boolean;
}