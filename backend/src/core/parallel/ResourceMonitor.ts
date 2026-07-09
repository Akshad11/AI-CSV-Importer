export class ResourceMonitor {
    private readonly memoryThresholdBytes: number;

    constructor(private readonly memoryThresholdPct = 0.85) {
        let heapLimit = 1024 * 1024 * 1024; // Default fallback to 1GB
        try {
            const v8 = require("v8");
            const stats = v8.getHeapStatistics();
            if (stats && stats.heap_size_limit) {
                heapLimit = stats.heap_size_limit;
            }
        } catch (e) {
            // Ignore if v8 is unavailable
        }
        this.memoryThresholdBytes = heapLimit * this.memoryThresholdPct;
    }

    /**
     * Returns true if active process heap size matches or exceeds the configured percentage boundary.
     */
    public isMemoryExceeded(): boolean {
        const mem = process.memoryUsage();
        return mem.heapUsed >= this.memoryThresholdBytes;
    }

    /**
     * Retrieves memory stats including total limit, usage, and fill percentage.
     */
    public getMemoryUsageInfo() {
        const mem = process.memoryUsage();
        let heapLimit = 1024 * 1024 * 1024;
        try {
            const v8 = require("v8");
            const stats = v8.getHeapStatistics();
            if (stats && stats.heap_size_limit) {
                heapLimit = stats.heap_size_limit;
            }
        } catch (e) {
            // Ignore
        }
        return {
            heapUsed: mem.heapUsed,
            heapTotal: heapLimit,
            percentage: mem.heapUsed / heapLimit
        };
    }
}
