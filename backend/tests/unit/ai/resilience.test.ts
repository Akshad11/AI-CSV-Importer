import { describe, expect, it, vi } from "vitest";
import { Container } from "../../../src/container/container";
import { AIRequestQueue } from "../../../src/services/ai/AIRequestQueue";
import { ProviderManager, ResilientAIProvider } from "../../../src/services/ai/ProviderManager";
import { ProviderHealthService } from "../../../src/services/ai/ProviderHealthService";
import { RetryEngine } from "../../../src/core/retry/RetryEngine";
import { RetryExecutor } from "../../../src/core/retry/RetryExecutor";
import { CancellationToken } from "../../../src/core/cancellation/CancellationToken";
import { RateLimitError } from "../../../src/services/ai/errors/RateLimitError";
import { AIProviderError } from "../../../src/services/ai/errors/AIProviderError";

describe("AI Infrastructure Resilience Tests", () => {
    describe("AIRequestQueue", () => {
        it("respects concurrency limits", async () => {
            const queue = new AIRequestQueue(2, 10);
            const activeTasks: string[] = [];
            const results: string[] = [];

            const createTask = (name: string, delay: number) => {
                return async () => {
                    activeTasks.push(name);
                    expect(activeTasks.length).toBeLessThanOrEqual(2);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    activeTasks.splice(activeTasks.indexOf(name), 1);
                    results.push(name);
                    return name;
                };
            };

            const p1 = queue.enqueue(createTask("task1", 20));
            const p2 = queue.enqueue(createTask("task2", 20));
            const p3 = queue.enqueue(createTask("task3", 10));

            await Promise.all([p1, p2, p3]);

            expect(results).toContain("task1");
            expect(results).toContain("task2");
            expect(results).toContain("task3");
        });

        it("respects task priorities", async () => {
            const queue = new AIRequestQueue(1, 10);
            const results: string[] = [];

            const createTask = (name: string) => {
                return async () => {
                    results.push(name);
                    return name;
                };
            };

            // Enqueue task1 which runs immediately (activeCount becomes 1)
            const p1 = queue.enqueue(async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                results.push("task1");
            }, 0);

            // Enqueue task2 (low priority) and task3 (high priority) while queue is blocked
            const p2 = queue.enqueue(createTask("task2"), 1);
            const p3 = queue.enqueue(createTask("task3"), 10);

            await Promise.all([p1, p2, p3]);

            // Since queue limit is 1 and task1 is active, task2 and task3 are queued.
            // task3 has higher priority (10 > 1), so it must run before task2!
            const lastTwo = results.slice(1);
            expect(lastTwo[0]).toBe("task3");
            expect(lastTwo[1]).toBe("task2");
        });
    });

    describe("RetryExecutor Retry-After Support", () => {
        it("parses and respects retryAfterSeconds from errors", async () => {
            const retryEngine = new RetryEngine();
            const option = {
                maxAttempts: 2,
                initialDelayMs: 1000,
                maxDelayMs: 10000,
                multiplier: 2,
                jitter: "none" as const,
                delayStrategy: "constant" as const
            };

            let attempts = 0;
            const operation = async () => {
                attempts++;
                if (attempts === 1) {
                    throw new RateLimitError("Rate limit exceeded", "mock", "test", 0.05); // 0.05 seconds = 50ms
                }
                return "success";
            };

            const start = Date.now();
            const result = await retryEngine.execute(operation, option, undefined, "retry-after-test");
            const duration = Date.now() - start;

            expect(result).toBe("success");
            expect(attempts).toBe(2);
            expect(duration).toBeGreaterThanOrEqual(45); // Slept at least 50ms (clamped by safety timer min)
        });
    });

    describe("ResilientAIProvider Fallback & Circuit Breakers", () => {
        it("switches to fallback provider when preferred fails", async () => {
            const container = new Container();
            const retryEngine = new RetryEngine();
            
            const mockGemini = {
                generate: vi.fn().mockRejectedValue(new Error("Gemini is offline")),
                stream: vi.fn(),
                health: vi.fn(),
                supportsStructuredOutput: () => true,
                supportsStreaming: () => true,
                getModelInformation: () => ({})
            };

            const mockOpenAI = {
                generate: vi.fn().mockResolvedValue({
                    success: true,
                    provider: "openai",
                    model: "gpt-5-mini",
                    data: { parsed: "success" }
                }),
                stream: vi.fn(),
                health: vi.fn(),
                supportsStructuredOutput: () => true,
                supportsStreaming: () => true,
                getModelInformation: () => ({})
            };

            container.registerSingleton("container", container);
            container.registerSingleton("ProviderHealthService", new ProviderHealthService());
            container.registerSingleton("GeminiProvider", mockGemini);
            container.registerSingleton("OpenAIProvider", mockOpenAI);

            process.env.AI_ALLOW_FALLBACK = "true";
            try {
                const resilientProvider = new ResilientAIProvider(
                    "gemini",
                    container,
                    retryEngine
                );

                const response = await resilientProvider.generate({
                    system: "system",
                    user: "user"
                });

                expect(response.success).toBe(true);
                expect(response.provider).toBe("openai");
                expect(mockGemini.generate).toHaveBeenCalled();
                expect(mockOpenAI.generate).toHaveBeenCalled();
            } finally {
                delete process.env.AI_ALLOW_FALLBACK;
            }
        });
    });
});
