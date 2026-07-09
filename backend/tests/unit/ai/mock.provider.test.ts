import { describe, expect, it } from "vitest";
import { MockProvider } from "../../../src/services/ai/providers/mock.provider";

describe("Mock Provider", () => {
    it("returns a successful response", async () => {
        const provider = new MockProvider();

        const result = await provider.generate({
            system: "You are a mock provider assistant",
            user: "Hello AI"
        });

        expect(result.success).toBe(true);

        expect(result.provider).toBe("mock");

        expect(result.data).toBeDefined();
    });
});