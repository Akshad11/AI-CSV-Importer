import { ModelInformation } from "./ai.types";

export const MODEL_CONFIGS: Record<string, ModelInformation> = {
    // OpenAI Models
    "gpt-5": {
        name: "gpt-5",
        contextWindow: 200000,
        maxOutputTokens: 8192,
        costPer1kPrompt: 0.0025,      // $0.0025 per 1k prompt tokens
        costPer1kCompletion: 0.0075,  // $0.0075 per 1k completion tokens
        supportsStructuredOutput: true,
        supportsStreaming: true
    },
    "gpt-5-mini": {
        name: "gpt-5-mini",
        contextWindow: 128000,
        maxOutputTokens: 4096,
        costPer1kPrompt: 0.00015,
        costPer1kCompletion: 0.0006,
        supportsStructuredOutput: true,
        supportsStreaming: true
    },
    "gpt-5-nano": {
        name: "gpt-5-nano",
        contextWindow: 128000,
        maxOutputTokens: 2048,
        costPer1kPrompt: 0.000075,
        costPer1kCompletion: 0.0003,
        supportsStructuredOutput: true,
        supportsStreaming: true
    },
    "gpt-4o": {
        name: "gpt-4o",
        contextWindow: 128000,
        maxOutputTokens: 4096,
        costPer1kPrompt: 0.005,
        costPer1kCompletion: 0.015,
        supportsStructuredOutput: true,
        supportsStreaming: true
    },

    // Gemini Models
    "gemini-2.5-pro": {
        name: "gemini-2.5-pro",
        contextWindow: 2000000, // 2 million token context
        maxOutputTokens: 8192,
        costPer1kPrompt: 0.007,
        costPer1kCompletion: 0.021,
        supportsStructuredOutput: true,
        supportsStreaming: true
    },
    "gemini-1.5-flash": {
        name: "gemini-1.5-flash",
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        costPer1kPrompt: 0.000075,
        costPer1kCompletion: 0.0003,
        supportsStructuredOutput: true,
        supportsStreaming: true
    },
    "gemini-3.5-flash": {
        name: "gemini-3.5-flash",
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        costPer1kPrompt: 0.000075,
        costPer1kCompletion: 0.0003,
        supportsStructuredOutput: true,
        supportsStreaming: true
    },
    "gemini-flash-lite": {
        name: "gemini-flash-lite",
        contextWindow: 1000000,
        maxOutputTokens: 4096,
        costPer1kPrompt: 0.0000375,
        costPer1kCompletion: 0.00015,
        supportsStructuredOutput: true,
        supportsStreaming: true
    },

    // Anthropic Claude Models
    "claude-3-5-sonnet": {
        name: "claude-3-5-sonnet",
        contextWindow: 200000,
        maxOutputTokens: 8192,
        costPer1kPrompt: 0.003,
        costPer1kCompletion: 0.015,
        supportsStructuredOutput: false, // Scaffold only
        supportsStreaming: true
    },
    "claude-3-opus": {
        name: "claude-3-opus",
        contextWindow: 200000,
        maxOutputTokens: 4096,
        costPer1kPrompt: 0.015,
        costPer1kCompletion: 0.075,
        supportsStructuredOutput: false,
        supportsStreaming: true
    },

    // Ollama / Local Models
    "ollama-local": {
        name: "ollama-local",
        contextWindow: 8192,
        maxOutputTokens: 2048,
        costPer1kPrompt: 0.0,
        costPer1kCompletion: 0.0,
        supportsStructuredOutput: false,
        supportsStreaming: true
    },

    // Mock Models
    "mock-model": {
        name: "mock-model",
        contextWindow: 10000,
        maxOutputTokens: 1000,
        costPer1kPrompt: 0.0,
        costPer1kCompletion: 0.0,
        supportsStructuredOutput: true,
        supportsStreaming: true
    }
};

export const DEFAULT_MODEL_CONFIGS: Record<string, string> = {
    openai: "gpt-5-mini",
    gemini: "gemini-3.5-flash",
    claude: "claude-3-5-sonnet",
    azure: "gpt-4o",
    ollama: "ollama-local",
    mock: "mock-model"
};
