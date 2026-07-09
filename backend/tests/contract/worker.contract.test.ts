import { describe, expect, it } from "vitest";
import { Worker } from "../../src/core/parallel/Worker";
import { RetryEngine } from "../../src/core/retry/RetryEngine";

describe("Worker Contract Verification Tests", () => {
    it("ensures workers conform to state states and stats tracking rules", async () => {
        const retryEngine = new RetryEngine();
        const worker = new Worker("worker-contract", retryEngine);

        expect(worker.getState()).toBe("idle");

        const task = async () => "processed";
        const result = await worker.execute(task);

        expect(result).toBe("processed");
        expect(worker.getState()).toBe("idle");

        const stats = worker.getStatistics();
        expect(stats.workerId).toBe("worker-contract");
        expect(stats.tasksProcessed).toBe(1);
    });
});
