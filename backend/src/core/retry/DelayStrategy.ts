import { DelayStrategyType, JitterStrategy } from "./RetryOptions";

export class DelayStrategy {
    /**
     * Calculates the delay in milliseconds for the given attempt and strategies.
     */
    public static calculate(
        attempt: number,
        type: DelayStrategyType,
        initialDelayMs: number,
        maxDelayMs: number,
        multiplier: number,
        jitter: JitterStrategy,
        previousDelayMs?: number,
        customCalculator?: (attempt: number, error?: Error) => number,
        error?: Error
    ): number {
        let baseDelay = 0;

        switch (type) {
            case "constant":
                baseDelay = initialDelayMs;
                break;

            case "linear":
                // Linear progression: initialDelay + (attempt - 1) * step (where step is multiplier)
                baseDelay = initialDelayMs + (attempt - 1) * multiplier;
                break;

            case "custom":
                if (customCalculator) {
                    baseDelay = customCalculator(attempt, error);
                } else {
                    baseDelay = initialDelayMs;
                }
                break;

            case "exponential":
            default:
                baseDelay = initialDelayMs * Math.pow(multiplier, attempt - 1);
                break;
        }

        // Apply upper delay limit
        baseDelay = Math.min(baseDelay, maxDelayMs);

        let finalDelay = baseDelay;

        switch (jitter) {
            case "none":
                finalDelay = baseDelay;
                break;

            case "full":
                // Random value between 0 and baseDelay
                finalDelay = Math.random() * baseDelay;
                break;

            case "equal":
                // Half baseDelay + random between 0 and half baseDelay
                const half = baseDelay / 2;
                finalDelay = half + Math.random() * half;
                break;

            case "decorrelated":
                // AWS Decorrelated Jitter: min(maxDelay, random(initialDelay, previousDelay * 3))
                const prev = previousDelayMs !== undefined && previousDelayMs > 0 ? previousDelayMs : initialDelayMs;
                const minVal = initialDelayMs;
                const maxVal = prev * 3;

                const low = Math.min(minVal, maxVal);
                const high = Math.max(minVal, maxVal);

                finalDelay = low + Math.random() * (high - low);
                break;
        }

        return Math.max(0, Math.min(Math.round(finalDelay), maxDelayMs));
    }
}
