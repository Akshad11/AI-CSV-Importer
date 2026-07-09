import { describe, expect, it } from "vitest";
import { ParallelExecutor } from "../../../src/core/parallel/ParallelExecutor";
import { RetryEngine } from "../../../src/core/retry/RetryEngine";
import { CancellationToken } from "../../../src/core/cancellation/CancellationToken";

describe("ParallelExecutor Unit Tests", () => {
    async function* makeStream<T>(arr: T[]): AsyncIterable<T> {
        for (const item of arr) {
            yield item;
        }
    }

    it("processes items concurrently returning results in original input order", async () => {
        const retryEngine = new RetryEngine();
        const executor = new ParallelExecutor(retryEngine);

        const source = makeStream([10, 20, 30, 40, 50]);
        const result = await executor.execute({
            source,
            worker: async (data: number) => {
                // Simulate variable processing latency
                await new Promise((resolve) => setTimeout(resolve, data === 20 ? 100 : 5));
                return data * 2;
            },
            concurrency: 3,
            ordered: true
        });

        expect(result.success).toBe(true);
        expect(result.results).toEqual([20, 40, 60, 80, 100]);
        expect(result.batchesProcessed).toBe(5);
        expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it("processes items returning results unordered", async () => {
        const retryEngine = new RetryEngine();
        const executor = new ParallelExecutor(retryEngine);

        const source = makeStream([1, 2, 3]);
        const result = await executor.execute({
            source,
            worker: async (data: number) => data,
            concurrency: 2,
            ordered: false
        });

        expect(result.success).toBe(true);
        expect(result.results.length).toBe(3);
        expect(result.results).toContain(1);
        expect(result.results).toContain(2);
        expect(result.results).toContain(3);
    });

    it("stops executing and exits cleanly on CancellationToken triggers", async () => {
        const retryEngine = new RetryEngine();
        const executor = new ParallelExecutor(retryEngine);
        const token = new CancellationToken();

        const source = (async function* () {
            yield 1;
            yield 2;
            token.cancel("Cancelled source stream processing");
            yield 3;
        })();

        const result = await executor.execute({
            source,
            worker: async (data: number) => data,
            concurrency: 2,
            cancellationToken: token
        });

        expect(result.success).toBe(false);
        expect(result.batchesProcessed).toBeLessThanOrEqual(2);
    });
});
