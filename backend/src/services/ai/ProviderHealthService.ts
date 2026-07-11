import { AIProviderHealth } from "./ai.types";

export interface ProviderStats {
    providerName: string;
    status: "healthy" | "unhealthy" | "degraded";
    successCount: number;
    failureCount: number;
    consecutiveFailures: number;
    averageLatencyMs: number;
    totalLatencyMs: number;
    lastError?: string;
    lastSuccessfulRequest?: Date;
}

export class ProviderHealthService {
    private readonly stats: Map<string, ProviderStats> = new Map();

    constructor() {
        // Initialize default stats for known providers
        const providers = ["gemini", "openai", "claude", "ollama", "azure", "mock"];
        for (const p of providers) {
            this.stats.set(p, {
                providerName: p,
                status: "healthy",
                successCount: 0,
                failureCount: 0,
                consecutiveFailures: 0,
                averageLatencyMs: 0,
                totalLatencyMs: 0
            });
        }
    }

    public recordSuccess(provider: string, latencyMs: number): void {
        const pStats = this.getOrCreateStats(provider);
        pStats.successCount++;
        pStats.consecutiveFailures = 0;
        pStats.totalLatencyMs += latencyMs;
        pStats.averageLatencyMs = pStats.totalLatencyMs / pStats.successCount;
        pStats.lastSuccessfulRequest = new Date();
        pStats.status = "healthy";
    }

    public recordFailure(provider: string, errorMsg: string): void {
        const pStats = this.getOrCreateStats(provider);
        pStats.failureCount++;
        pStats.consecutiveFailures++;
        pStats.lastError = errorMsg;
        
        if (pStats.consecutiveFailures >= 5) {
            pStats.status = "unhealthy";
        } else if (pStats.consecutiveFailures >= 3) {
            pStats.status = "degraded";
        }
    }

    public getStats(provider: string): ProviderStats | undefined {
        return this.stats.get(provider.toLowerCase());
    }

    public getAllStats(): ProviderStats[] {
        return Array.from(this.stats.values());
    }

    private getOrCreateStats(provider: string): ProviderStats {
        const key = provider.toLowerCase();
        let pStats = this.stats.get(key);
        if (!pStats) {
            pStats = {
                providerName: key,
                status: "healthy",
                successCount: 0,
                failureCount: 0,
                consecutiveFailures: 0,
                averageLatencyMs: 0,
                totalLatencyMs: 0
            };
            this.stats.set(key, pStats);
        }
        return pStats;
    }
}
