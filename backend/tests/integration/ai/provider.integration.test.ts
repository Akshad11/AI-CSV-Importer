import { describe, expect, it } from "vitest";
import { MockProvider } from "../../../src/services/ai/providers/mock.provider";
import { OpenAIProvider } from "../../../src/services/ai/providers/openai.provider";
import { GeminiProvider } from "../../../src/services/ai/providers/gemini.provider";
import { leadSchema } from "../../../src/services/ai/schemas/lead.schema";

describe("AI Provider Integration Tests", () => {
    it("verifies Mock Provider integration with Zod schemas for structured outputs", async () => {
        const provider = new MockProvider();
        const response = await provider.generate({
            system: "Extract details",
            user: "John Doe at Acme (john@example.com)",
            responseSchema: leadSchema
        });

        expect(response.success).toBe(true);
        expect(response.provider).toBe("mock");
        expect(Array.isArray(response.data)).toBe(true);
        expect((response.data as any)[0].email).toBe("john.doe@example.com");
    });

    // Conditional tests: Only run if API keys are configured in environment
    const runOpenAITest = process.env.OPENAI_API_KEY ? it : it.skip;
    runOpenAITest("verifies real OpenAI provider structured output with Zod schema", async () => {
        const provider = new OpenAIProvider();
        const response = await provider.generate({
            system: "Extract leads from user content. Return a JSON array matching the schema.",
            user: "Lead 1: Name: John Smith, Email: john.smith@acme.com, Company: Acme Corp, Title: Sales Manager",
            responseSchema: leadSchema,
            responseSchemaName: "leads"
        });

        expect(response.success).toBe(true);
        expect(response.provider).toBe("openai");
        expect(Array.isArray(response.data)).toBe(true);
        expect((response.data as any)[0].email).toBe("john.smith@acme.com");
    });

    const runGeminiTest = process.env.GEMINI_API_KEY ? it : it.skip;
    runGeminiTest("verifies real Gemini provider structured output with Zod schema", async () => {
        const provider = new GeminiProvider();
        const response = await provider.generate({
            system: "Extract leads from user content. Return a JSON array matching the schema.",
            user: "Lead 1: Name: Alice Johnson, Email: alice@example.com, Company: TechCorp, Title: Engineer",
            responseSchema: leadSchema,
            responseSchemaName: "leads"
        });

        expect(response.success).toBe(true);
        expect(response.provider).toBe("gemini");
        expect(Array.isArray(response.data)).toBe(true);
        expect((response.data as any)[0].email).toBe("alice@example.com");
    });
});
