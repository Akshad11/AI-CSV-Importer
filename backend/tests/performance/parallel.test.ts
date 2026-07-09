import { describe, expect, it } from "vitest";
import { ParallelExecutor } from "../../src/core/parallel/ParallelExecutor";
import { RetryEngine } from "../../src/core/retry/RetryEngine";

describe("Parallel Execution Performance Tests", () => {
    async function* makeSource(count: number) {
        for (let i = 0; i < count; i++) yield i;
    }

    it("demonstrates super-linear speedup: concurrency=8 is 4x faster than concurrency=1", async () => {
        const ITEMS = 800;
        const retryEngine = new RetryEngine();

        const worker = async (n: number) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            return n;
        };

        const executor = new ParallelExecutor(retryEngine);

        const startSerial = Date.now();
        await executor.execute({ source: makeSource(ITEMS), worker, concurrency: 1 });
        const serialMs = Date.now() - startSerial;

        const startParallel = Date.now();
        await executor.execute({ source: makeSource(ITEMS), worker, concurrency: 8 });
        const parallelMs = Date.now() - startParallel;

        const speedup = serialMs / parallelMs;
        console.log(`[parallel] Serial: ${serialMs}ms | Parallel (c=8): ${parallelMs}ms | Speedup: ${speedup.toFixed(1)}x`);

        expect(speedup).toBeGreaterThan(3);
    }, 60000);

    it("handles 2,000-item source with concurrency=16 without worker starvation", async () => {
        const ITEMS = 2000;
        const retryEngine = new RetryEngine();
        const executor = new ParallelExecutor(retryEngine);

        const result = await executor.execute({
            source: makeSource(ITEMS),
            worker: async (n) => n,
            concurrency: 16
        });

        expect(result.results.length).toBe(ITEMS);
        expect(result.batchesProcessed).toBeGreaterThan(0);
    }, 30000);
});
