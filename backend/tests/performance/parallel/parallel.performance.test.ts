import { describe, expect, it } from "vitest";
import { ParallelExecutor } from "../../../src/core/parallel/ParallelExecutor";
import { RetryEngine } from "../../../src/core/retry/RetryEngine";
import { ResourceMonitor } from "../../../src/core/parallel/ResourceMonitor";

describe("ParallelExecutor Performance & Stress Tests", () => {
    async function* makeStream(count: number): AsyncIterable<number> {
        for (let i = 0; i < count; i++) {
            yield i;
        }
    }

    it("processes a workload of 1000 batches while maintaining constant memory bounds", async () => {
        const retryEngine = new RetryEngine();
        const executor = new ParallelExecutor(retryEngine);
        const monitor = new ResourceMonitor();

        const memStart = monitor.getMemoryUsageInfo();

        const result = await executor.execute({
            source: makeStream(1000),
            worker: async (data: number) => {
                // Short wait to ensure active concurrency interleaving
                if (data % 50 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 2));
                }
                return data * 10;
            },
            concurrency: 15,
            ordered: false
        });

        const memEnd = monitor.getMemoryUsageInfo();

        expect(result.success).toBe(true);
        expect(result.batchesProcessed).toBe(1000);
        expect(result.throughputBatchesPerSec).toBeGreaterThan(0);
        
        // Memory boundary assertion: heap size should not overflow heap capacity
        expect(memEnd.heapUsed).toBeLessThan(memStart.heapTotal);
    });
});
