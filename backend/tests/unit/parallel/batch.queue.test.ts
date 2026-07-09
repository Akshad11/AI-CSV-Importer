import { describe, expect, it } from "vitest";
import { BatchQueue } from "../../../src/core/parallel/BatchQueue";

describe("BatchQueue Unit Tests", () => {
    it("sorts enqueued items based on priority and sequence indices", async () => {
        const queue = new BatchQueue({ maxQueueSize: 5, highWatermark: 0.8, lowWatermark: 0.3 });

        queue.enqueue({ id: "1", data: "low", priority: 1, index: 0, timestamp: new Date() });
        queue.enqueue({ id: "2", data: "high", priority: 10, index: 1, timestamp: new Date() });
        queue.enqueue({ id: "3", data: "med", priority: 5, index: 2, timestamp: new Date() });

        const first = await queue.dequeue();
        expect(first.data).toBe("high");

        const second = await queue.dequeue();
        expect(second.data).toBe("med");

        const third = await queue.dequeue();
        expect(third.data).toBe("low");
    });

    it("orders items FIFO when priorities are equal", async () => {
        const queue = new BatchQueue();

        queue.enqueue({ id: "1", data: "idx1", priority: 3, index: 1, timestamp: new Date() });
        queue.enqueue({ id: "2", data: "idx0", priority: 3, index: 0, timestamp: new Date() });

        const first = await queue.dequeue();
        expect(first.data).toBe("idx0"); // index 0 comes before index 1
    });

    it("supports queue pause and resume commands", async () => {
        const queue = new BatchQueue();
        queue.pause();
        expect(queue.isPaused()).toBe(true);

        queue.enqueue({ id: "1", data: "val", priority: 1, index: 0, timestamp: new Date() });
        
        let resolved = false;
        const promise = queue.dequeue().then(() => { resolved = true; });

        // Let microtasks run, should not resolve because queue is paused
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(resolved).toBe(false);

        queue.resume();
        expect(queue.isPaused()).toBe(false);
        await promise;
        expect(resolved).toBe(true);
    });
});
