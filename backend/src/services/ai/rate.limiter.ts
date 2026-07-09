export interface RateLimiterOptions {
    requestsPerMinute: number;
    tokensPerMinute: number;
}

export class RateLimiter {
    private requestsRemaining: number;
    private tokensRemaining: number;
    private lastRefillTime: number;
    private timer: NodeJS.Timeout | null = null;

    private queue: {
        tokens: number;
        resolve: () => void;
        reject: (err: Error) => void;
    }[] = [];

    constructor(private readonly options: RateLimiterOptions) {
        this.requestsRemaining = options.requestsPerMinute;
        this.tokensRemaining = options.tokensPerMinute;
        this.lastRefillTime = Date.now();
    }

    /**
     * Acquires slot from token bucket. If rate limit is exceeded, queues
     * the request and returns a promise that resolves when a slot is ready.
     */
    public async acquire(tokensCount: number): Promise<void> {
        this.refill();

        // Check if there is capacity immediately and the queue is empty
        if (
            this.queue.length === 0 &&
            this.requestsRemaining >= 1 &&
            this.tokensRemaining >= tokensCount
        ) {
            this.requestsRemaining -= 1;
            this.tokensRemaining -= tokensCount;
            return;
        }

        return new Promise<void>((resolve, reject) => {
            this.queue.push({ tokens: tokensCount, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Refills the buckets based on elapsed time.
     */
    private refill(): void {
        const now = Date.now();
        const elapsedMs = now - this.lastRefillTime;
        if (elapsedMs <= 0) return;

        const minutesFraction = elapsedMs / 60000;

        const requestsToAdd = minutesFraction * this.options.requestsPerMinute;
        const tokensToAdd = minutesFraction * this.options.tokensPerMinute;

        this.requestsRemaining = Math.min(
            this.options.requestsPerMinute,
            this.requestsRemaining + requestsToAdd
        );
        
        this.tokensRemaining = Math.min(
            this.options.tokensPerMinute,
            this.tokensRemaining + tokensToAdd
        );

        this.lastRefillTime = now;
    }

    /**
     * Tries to process queued requests, scheduling a delay if buckets are dry.
     */
    private processQueue(): void {
        this.refill();

        if (this.queue.length === 0) {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            return;
        }

        const next = this.queue[0];

        if (this.requestsRemaining >= 1 && this.tokensRemaining >= next.tokens) {
            this.queue.shift();
            this.requestsRemaining -= 1;
            this.tokensRemaining -= next.tokens;
            
            // Resolve next item in macro-task queue to prevent execution call-stack explosion
            setTimeout(() => next.resolve(), 0);
            
            this.processQueue();
            return;
        }

        // Calculate delay required to fulfill the next item's demands
        const requestsNeeded = 1 - this.requestsRemaining;
        const tokensNeeded = next.tokens - this.tokensRemaining;

        const timeForRequestsMs = (requestsNeeded / this.options.requestsPerMinute) * 60000;
        const timeForTokensMs = (tokensNeeded / this.options.tokensPerMinute) * 60000;

        const delayMs = Math.max(0, Math.max(timeForRequestsMs, timeForTokensMs));

        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            this.processQueue();
        }, Math.max(10, delayMs)); // safety floor of 10ms
    }
}
