import { IAIProvider } from "../ai.provider";
import {
    AIRequest,
    AIResponse,
    AIStreamChunk,
    AIProviderHealth,
    ModelInformation
} from "../ai.types";
import { TokenUsageCalculator } from "../token.usage";
import { MODEL_CONFIGS } from "../model.config";
import { AIProviderError } from "../errors/AIProviderError";

export class OllamaProvider implements IAIProvider {
    private readonly url: string;

    constructor() {
        let url = process.env.OLLAMA_URL || process.env.LOCAL_LLAMA_URL || "http://127.0.0.1:11434";
        if (url.includes("localhost")) {
            url = url.replace("localhost", "127.0.0.1");
        }
        this.url = url;
    }

    async generate<T = unknown>(request: AIRequest): Promise<AIResponse<T>> {
        const modelName = process.env.OLLAMA_MODEL || request.model || "llama3";
        const start = Date.now();

        try {
            const res = await fetch(`${this.url}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: "system", content: request.system },
                        { role: "user", content: request.user }
                    ],
                    options: {
                        temperature: request.temperature ?? 0.2,
                        num_predict: request.maxOutputTokens
                    },
                    stream: false
                })
            });

            if (!res.ok) {
                throw new Error(`Ollama returned status ${res.status}: ${await res.text()}`);
            }

            const payload = (await res.json()) as any;
            const latency = Date.now() - start;

            const usage = TokenUsageCalculator.createUsage(
                "ollama-local",
                payload.prompt_eval_count || 0,
                payload.eval_count || 0
            );

            const content = payload.message?.content || "";
            let responseData: any;
            if (request.responseSchema) {
                responseData = JSON.parse(content);
            } else {
                responseData = content;
            }

            return {
                success: true,
                provider: "ollama",
                model: modelName,
                data: responseData as T,
                usage,
                latencyMs: latency
            };
        } catch (error: any) {
            throw new AIProviderError(
                "Ollama provider error: " + error.message,
                "ollama",
                modelName,
                error
            );
        }
    }

    async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
        const modelName = process.env.OLLAMA_MODEL || request.model || "llama3";

        try {
            const res = await fetch(`${this.url}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: "system", content: request.system },
                        { role: "user", content: request.user }
                    ],
                    options: {
                        temperature: request.temperature ?? 0.2,
                        num_predict: request.maxOutputTokens
                    },
                    stream: true
                })
            });

            if (!res.ok) {
                throw new Error(`Ollama returned status ${res.status}: ${await res.text()}`);
            }

            if (!res.body) {
                throw new Error("No response body from Ollama streaming API");
            }

            const reader = res.body.getReader ? res.body.getReader() : (res.body as any);
            const decoder = new TextDecoder();

            if (typeof reader.read === "function") {
                let buffer = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        const json = JSON.parse(line);

                        const text = json.message?.content || "";
                        const isLast = json.done === true;
                        const usage = isLast
                            ? TokenUsageCalculator.createUsage(
                                  "ollama-local",
                                  json.prompt_eval_count || 0,
                                  json.eval_count || 0
                              )
                            : undefined;

                        yield { text, usage, isLast };
                    }
                }
            } else {
                for await (const chunk of reader) {
                    const line = decoder.decode(chunk).trim();
                    if (!line) continue;

                    const json = JSON.parse(line);
                    const text = json.message?.content || "";
                    const isLast = json.done === true;
                    const usage = isLast
                        ? TokenUsageCalculator.createUsage(
                              "ollama-local",
                              json.prompt_eval_count || 0,
                              json.eval_count || 0
                          )
                        : undefined;

                    yield { text, usage, isLast };
                }
            }
        } catch (error: any) {
            throw new AIProviderError(
                "Ollama streaming error: " + error.message,
                "ollama",
                modelName,
                error
            );
        }
    }

    async health(): Promise<AIProviderHealth> {
        try {
            const start = Date.now();
            const res = await fetch(`${this.url}/api/tags`);
            const latency = Date.now() - start;

            if (!res.ok) {
                return {
                    available: false,
                    configured: true,
                    authenticated: false,
                    error: `Ollama returned health status ${res.status}`
                };
            }

            return {
                available: true,
                latencyMs: latency,
                version: "v1",
                model: process.env.OLLAMA_MODEL || "llama3",
                configured: true,
                authenticated: true
            };
        } catch (error: any) {
            return {
                available: false,
                configured: true,
                authenticated: false,
                error: "Ollama offline: " + error.message
            };
        }
    }

    supportsStructuredOutput(): boolean {
        return false;
    }

    supportsStreaming(): boolean {
        return true;
    }

    async getModelInformation(modelName?: string): Promise<ModelInformation> {
        return MODEL_CONFIGS["ollama-local"];
    }
}
