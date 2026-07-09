export class ThroughputCalculator {
    private peakThroughputRowsPerSec = 0;
    private peakThroughputBatchesPerSec = 0;

    /**
     * Calculates processing speeds based on total completions and execution durations.
     */
    public calculateThroughput(
        rowsCount: number,
        batchesCount: number,
        tokensCount: number,
        durationMs: number
    ) {
        if (durationMs <= 0) {
            return {
                rowsPerSecond: 0,
                batchesPerSecond: 0,
                tokensPerSecond: 0,
                peakThroughput: 0
            };
        }

        const seconds = durationMs / 1000;
        const rowsPerSecond = parseFloat((rowsCount / seconds).toFixed(2));
        const batchesPerSecond = parseFloat((batchesCount / seconds).toFixed(2));
        const tokensPerSecond = parseFloat((tokensCount / seconds).toFixed(2));

        this.peakThroughputRowsPerSec = Math.max(this.peakThroughputRowsPerSec, rowsPerSecond);
        this.peakThroughputBatchesPerSec = Math.max(this.peakThroughputBatchesPerSec, batchesPerSecond);

        return {
            rowsPerSecond,
            batchesPerSecond,
            tokensPerSecond,
            peakThroughput: this.peakThroughputRowsPerSec
        };
    }

    /**
     * Calculates latency percentiles (P50, P90, P95, P99) from a recorded array of execution timings.
     */
    public calculatePercentiles(latenciesMs: number[]): {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    } {
        if (latenciesMs.length === 0) {
            return { p50: 0, p90: 0, p95: 0, p99: 0 };
        }

        const sorted = [...latenciesMs].sort((a, b) => a - b);
        const len = sorted.length;

        const getPercentile = (p: number): number => {
            const index = Math.floor(len * p);
            return sorted[Math.min(index, len - 1)];
        };

        return {
            p50: getPercentile(0.5),
            p90: getPercentile(0.9),
            p95: getPercentile(0.95),
            p99: getPercentile(0.99)
        };
    }
}
