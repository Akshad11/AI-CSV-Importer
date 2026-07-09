export interface AIRequest {
    system: string;

    user: string;

    model?: string;

    temperature?: number;

    maxOutputTokens?: number;
}

export interface AIResponse<T = unknown> {
    success: boolean;

    provider: string;

    model: string;

    data: T;

    usage?: {
        promptTokens?: number;

        completionTokens?: number;

        totalTokens?: number;
    };
}