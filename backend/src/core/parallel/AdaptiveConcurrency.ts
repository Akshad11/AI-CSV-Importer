import { ConcurrencyController } from "./ConcurrencyController";

export class AdaptiveConcurrency {
    constructor(
        private readonly controller: ConcurrencyController,
        private readonly minConcurrency = 1,
        private readonly maxConcurrency = 100
    ) {}

    /**
     * Suggests dynamic adjustments to worker counts based on system load metrics (foundation).
     */
    public adjust(metrics: {
        errorRate: number;
        retryRate: number;
        memoryPressure: number;
        aiLatencyMs?: number;
    }): void {
        const current = this.controller.getConcurrency();
        let next = current;

        // Downscale concurrency if errors, retries, or memory pressures are high
        if (metrics.errorRate > 0.3 || metrics.retryRate > 0.5 || metrics.memoryPressure > 0.9) {
            next = Math.max(this.minConcurrency, Math.floor(current * 0.7));
        } 
        // Upscale concurrency if execution environment remains stable and healthy
        else if (metrics.errorRate === 0 && metrics.retryRate === 0 && metrics.memoryPressure < 0.7) {
            next = Math.min(this.maxConcurrency, Math.floor(current * 1.2) + 1);
        }

        if (next !== current) {
            this.controller.setConcurrency(next);
        }
    }
}
