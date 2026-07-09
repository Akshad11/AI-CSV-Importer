import { describe, expect, it } from "vitest";
import { MockProvider } from "../../../src/services/ai/providers/mock.provider";
import { OpenAIProvider } from "../../../src/services/ai/providers/openai.provider";
import { GeminiProvider } from "../../../src/services/ai/providers/gemini.provider";
import { ClaudeProvider } from "../../../src/services/ai/providers/claude.provider";
import { AzureOpenAIProvider } from "../../../src/services/ai/providers/azure.provider";
import { OllamaProvider } from "../../../src/services/ai/providers/ollama.provider";

const providers = [
    { name: "Mock", provider: new MockProvider() },
    { name: "OpenAI", provider: new OpenAIProvider() },
    { name: "Gemini", provider: new GeminiProvider() },
    { name: "Claude", provider: new ClaudeProvider() },
    { name: "Azure OpenAI", provider: new AzureOpenAIProvider() },
    { name: "Ollama", provider: new OllamaProvider() }
];

describe("AI Provider Contract Verification Tests", () => {
    providers.forEach(({ name, provider }) => {
        describe(`Interface Compliance: ${name}`, () => {
            it("implements supportsStructuredOutput and supportsStreaming", () => {
                expect(typeof provider.supportsStructuredOutput()).toBe("boolean");
                expect(typeof provider.supportsStreaming()).toBe("boolean");
            });

            it("implements getModelInformation returning valid model bounds and metrics", async () => {
                const info = await provider.getModelInformation();
                expect(info).toBeDefined();
                expect(info.name).toBeDefined();
                expect(info.contextWindow).toBeGreaterThan(0);
                expect(info.maxOutputTokens).toBeGreaterThan(0);
                expect(typeof info.costPer1kPrompt).toBe("number");
                expect(typeof info.costPer1kCompletion).toBe("number");
            });

            it("implements health method exposing availability stats", async () => {
                const health = await provider.health();
                expect(health).toBeDefined();
                expect(typeof health.available).toBe("boolean");
                expect(typeof health.configured).toBe("boolean");
                expect(typeof health.authenticated).toBe("boolean");
            });

            // Functional contract checks run against Mock provider (without needing API secrets)
            if (name === "Mock") {
                it("executes generate successfully returning mapped TokenUsage details", async () => {
                    const res = await provider.generate({ system: "sys", user: "usr" });
                    expect(res.success).toBe(true);
                    expect(res.provider).toBe("mock");
                    expect(res.data).toContain("Hello from Mock Provider");
                    expect(res.usage).toBeDefined();
                    expect(res.usage?.totalTokens).toBeGreaterThan(0);
                    expect(res.usage?.estimatedCost).toBeDefined();
                });

                it("streams chunks successfully mapping usage details on termination", async () => {
                    const chunks = [];
                    for await (const chunk of provider.stream({ system: "sys", user: "usr" })) {
                        chunks.push(chunk);
                    }
                    expect(chunks.length).toBeGreaterThan(0);
                    expect(chunks[0].text).toBeDefined();
                    expect(chunks[chunks.length - 1].isLast).toBe(true);
                    expect(chunks[chunks.length - 1].usage).toBeDefined();
                });
            }
        });
    });
});
