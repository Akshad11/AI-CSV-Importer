import { describe, expect, it } from "vitest";
import { RetryPolicy } from "../../../src/services/ai/retry.policy";
import { RetryLimitExceededError } from "../../../src/services/ai/errors/RetryLimitExceededError";

describe("RetryPolicy Unit Tests", () => {
    it("returns result on first attempt if successful", async () => {
        let calls = 0;
        const result = await RetryPolicy.execute(
            async () => {
                calls++;
                return "success";
            },
            "mock",
            "mock-model"
        );
        expect(result).toBe("success");
        expect(calls).toBe(1);
    });

    it("retries transient errors (e.g. 503) and succeeds when error resolves", async () => {
        let calls = 0;
        const result = await RetryPolicy.execute(
            async () => {
                calls++;
                if (calls === 1) {
                    const err: any = new Error("Service Unavailable");
                    err.status = 503;
                    throw err;
                }
                return "recovered";
            },
            "mock",
            "mock-model",
            { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 5, backoffFactor: 2 }
        );
        expect(result).toBe("recovered");
        expect(calls).toBe(2);
    });

    it("does not retry client error codes (e.g. 401 Unauthorized)", async () => {
        let calls = 0;
        const action = () => RetryPolicy.execute(
            async () => {
                calls++;
                const err: any = new Error("Unauthorized");
                err.status = 401;
                throw err;
            },
            "mock",
            "mock-model",
            { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 5, backoffFactor: 2 }
        );
        await expect(action).rejects.toThrow("Unauthorized");
        expect(calls).toBe(1);
    });

    it("throws RetryLimitExceededError when retry limit is reached on 429 RateLimit", async () => {
        let calls = 0;
        const action = () => RetryPolicy.execute(
            async () => {
                calls++;
                const err: any = new Error("Rate Limit Exceeded");
                err.status = 429;
                throw err;
            },
            "mock",
            "mock-model",
            { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 5, backoffFactor: 2 }
        );
        await expect(action).rejects.toThrow(RetryLimitExceededError);
        expect(calls).toBe(3); // 1 initial + 2 retries
    });
});
