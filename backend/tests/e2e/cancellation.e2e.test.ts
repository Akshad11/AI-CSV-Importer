import { describe, expect, it } from "vitest";
import { CancellationToken } from "../../src/core/cancellation/CancellationToken";
import { ParallelExecutor } from "../../src/core/parallel/ParallelExecutor";
import { RetryEngine } from "../../src/core/retry/RetryEngine";

describe("Cancellation E2E Test", () => {
    async function* makeStream() {
        yield 1;
        yield 2;
    }

    it("terminates execution immediately on cancellation requests", async () => {
        const retryEngine = new RetryEngine();
        const executor = new ParallelExecutor(retryEngine);
        const token = new CancellationToken();

        token.cancel("User cancellation request");

        const result = await executor.execute({
            source: makeStream(),
            worker: async (data) => data,
            concurrency: 2,
            cancellationToken: token
        });

        expect(result.success).toBe(false);
        expect(result.batchesProcessed).toBe(0);
    });
});
