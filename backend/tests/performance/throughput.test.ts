import { describe, expect, it } from "vitest";
import { ParallelExecutor } from "../../src/core/parallel/ParallelExecutor";
import { RetryEngine } from "../../src/core/retry/RetryEngine";
import { CsvGenerator } from "../utils/CsvGenerator";

describe("Throughput Performance Tests", () => {
    it("processes 5,000 items meeting minimum 2000 rows/sec throughput", async () => {
        const ROWS = 5000;
        const MIN_ROWS_PER_SEC = 2000;

        const retryEngine = new RetryEngine();
        const executor = new ParallelExecutor(retryEngine);

        async function* sourceItems() {
            for (let i = 0; i < ROWS; i++) {
                yield i;
            }
        }

        const start = Date.now();
        const result = await executor.execute({
            source: sourceItems(),
            worker: async (n) => n * 2,
            concurrency: 8
        });
        const durationSec = (Date.now() - start) / 1000;
        const rowsPerSec = result.results.length / durationSec;

        console.log(`[throughput] Rows/sec: ${rowsPerSec.toFixed(0)} | Duration: ${(durationSec * 1000).toFixed(0)}ms`);

        expect(result.results.length).toBe(ROWS);
        expect(rowsPerSec).toBeGreaterThan(MIN_ROWS_PER_SEC);
    }, 30000);

    it("generates 10,000-row CSV payload within 500ms", () => {
        const start = Date.now();
        const csv = CsvGenerator.generate(10000);
        const durationMs = Date.now() - start;

        console.log(`[csv-gen] CSV generation 10k rows: ${durationMs}ms`);
        expect(durationMs).toBeLessThan(500);
        expect(csv.split("\n").length).toBe(10001); // header + 10000 rows
    });
});
