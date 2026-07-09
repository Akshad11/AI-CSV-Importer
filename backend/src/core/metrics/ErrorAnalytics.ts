import { ErrorSummary, ErrorProfile } from "./MetricsTypes";

export class ErrorAnalytics {
    private readonly profiles: Map<string, ErrorProfile> = new Map();
    private counts = {
        validationErrors: 0,
        providerErrors: 0,
        retryErrors: 0,
        timeouts: 0,
        cancellations: 0,
        csvErrors: 0,
        batchErrors: 0,
        jsonErrors: 0,
        unknownErrors: 0
    };

    /**
     * Records and profiles an execution failure.
     */
    public recordError(error: Error, stage: string, batchIndex?: number, provider?: string): void {
        const message = error.message || "Unknown error occurred";
        const name = error.name || "Error";

        let errorType = "unknown";
        if (name.includes("Validation") || message.includes("validation")) {
            errorType = "validation";
            this.counts.validationErrors++;
        } else if (name.includes("Provider") || message.includes("provider") || message.includes("AI")) {
            errorType = "provider";
            this.counts.providerErrors++;
        } else if (name.includes("Retry") || name.includes("Exhausted")) {
            errorType = "retry";
            this.counts.retryErrors++;
        } else if (name.includes("Timeout") || message.includes("timeout") || message.includes("timed out")) {
            errorType = "timeout";
            this.counts.timeouts++;
        } else if (name.includes("Cancel") || message.includes("cancellation") || message.includes("cancelled")) {
            errorType = "cancellation";
            this.counts.cancellations++;
        } else if (name.includes("CSV") || message.includes("parser") || message.includes("parse")) {
            errorType = "csv";
            this.counts.csvErrors++;
        } else if (name.includes("Batch") || message.includes("batch")) {
            errorType = "batch";
            this.counts.batchErrors++;
        } else if (name.includes("JSON") || message.includes("SyntaxError")) {
            errorType = "json";
            this.counts.jsonErrors++;
        } else {
            this.counts.unknownErrors++;
        }

        const profileKey = `${stage}:${errorType}:${message}`;
        const existing = this.profiles.get(profileKey);
        if (existing) {
            existing.frequency++;
            existing.timestamp = new Date();
        } else {
            this.profiles.set(profileKey, {
                type: errorType,
                message,
                stage,
                provider,
                batchIndex,
                timestamp: new Date(),
                frequency: 1
            });
        }
    }

    public getErrorSummary(): ErrorSummary {
        return {
            ...this.counts,
            profiles: Array.from(this.profiles.values())
        };
    }
}
