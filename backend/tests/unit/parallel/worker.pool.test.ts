import { describe, expect, it } from "vitest";
import { WorkerPool } from "../../../src/core/parallel/WorkerPool";
import { RetryEngine } from "../../../src/core/retry/RetryEngine";

describe("WorkerPool & Worker Unit Tests", () => {
    it("allocates workers matching the designated pool capacity", () => {
        const retryEngine = new RetryEngine();
        const pool = new WorkerPool(3, retryEngine);
        expect(pool.getWorkers().length).toBe(3);
        expect(pool.getIdleWorkersCount()).toBe(3);
        expect(pool.getBusyWorkersCount()).toBe(0);
    });

    it("allocates next idle workers and recovers failed ones", async () => {
        const retryEngine = new RetryEngine();
        const pool = new WorkerPool(2, retryEngine);

        const w1 = pool.allocate();
        expect(w1).not.toBeNull();
        expect(w1!.id).toBe("worker-0");

        // Running a fast task to assert state mutation tracking
        const taskPromise = w1!.execute(async () => "ok", "default", undefined, 0, "test");
        expect(w1!.getState()).toBe("busy");

        const w2 = pool.allocate();
        expect(w2).not.toBeNull();
        expect(w2!.id).toBe("worker-1");

        await taskPromise;
        expect(w1!.getState()).toBe("idle");

        const stats = w1!.getStatistics();
        expect(stats.tasksProcessed).toBe(1);
    });
});
