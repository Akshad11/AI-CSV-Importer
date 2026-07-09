import { describe, expect, it } from "vitest";
import { RetryEngine } from "../../src/core/retry/RetryEngine";

describe("RetryEngine Contract Verification Tests", () => {
    it("satisfies the retry execute contract returning expected data outputs", async () => {
        const engine = new RetryEngine();

        const action = async () => "success-payload";
        const result = await engine.execute(action, { maxAttempts: 2 });

        expect(result).toBe("success-payload");
    });
});
