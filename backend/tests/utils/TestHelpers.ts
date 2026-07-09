import { expect } from "vitest";

export class TestHelpers {
    public static assertDuration(actualMs: number, minMs: number, maxMs: number): void {
        expect(actualMs).toBeGreaterThanOrEqual(minMs);
        expect(actualMs).toBeLessThanOrEqual(maxMs);
    }

    /**
     * Polls heap memory usage.
     */
    public static getMemoryUsage(): number {
        return process.memoryUsage().heapUsed;
    }

    public static async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
