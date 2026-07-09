import { describe, expect, it } from "vitest";
import { RetryEngine } from "../../src/core/retry/RetryEngine";

describe("Retry Engine E2E Test", () => {
    it("successfully recovers action execution after transient operation failures", async () => {
        const engine = new RetryEngine();

        let attempts = 0;
        const result = await engine.execute(
            async () => {
                attempts++;
                // First 2 attempts fail, 3rd succeeds
                if (attempts < 3) {
                    throw new Error(`Transient failure attempt ${attempts}`);
                }
                return "recovered-success";
            },
            { maxAttempts: 5, initialDelayMs: 1, delayStrategy: "constant", jitter: "none" }
        );

        expect(result).toBe("recovered-success");
        expect(attempts).toBe(3);
    });
});

