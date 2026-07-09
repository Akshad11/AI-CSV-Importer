import { EventBus } from "./EventBus";
import { ImportStats } from "../types/common";

export class ProgressEmitter {
    constructor(
        private readonly eventBus: EventBus,
        private readonly importId: string
    ) {}

    public async emitStarted(
        stage: string,
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("import:started", {
            importId: this.importId,
            stage,
            timestamp: new Date(),
            statistics,
            metadata,
        });
    }

    public async emitParsingStarted(
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("parsing:started", {
            importId: this.importId,
            stage: "parsing",
            timestamp: new Date(),
            statistics,
            metadata,
        });
    }

    public async emitParsingCompleted(
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("parsing:completed", {
            importId: this.importId,
            stage: "parsing",
            timestamp: new Date(),
            statistics,
            metadata,
        });
    }

    public async emitRowParsed(
        rowNumber: number,
        rawRow: Record<string, unknown>,
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("row:parsed", {
            importId: this.importId,
            stage: "parsing",
            timestamp: new Date(),
            rowNumber,
            rawRow,
            statistics,
            metadata,
        });
    }

    public async emitBatchCreated(
        batchNumber: number,
        totalRows: number,
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("batch:created", {
            importId: this.importId,
            stage: "batching",
            timestamp: new Date(),
            batchNumber,
            totalRows,
            statistics,
            metadata,
        });
    }

    public async emitBatchStarted(
        batchNumber: number,
        totalRows: number,
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("batch:started", {
            importId: this.importId,
            stage: "batching",
            timestamp: new Date(),
            batchNumber,
            totalRows,
            statistics,
            metadata,
        });
    }

    public async emitBatchCompleted(
        batchNumber: number,
        totalRows: number,
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("batch:completed", {
            importId: this.importId,
            stage: "batching",
            timestamp: new Date(),
            batchNumber,
            totalRows,
            statistics,
            metadata,
        });
    }

    public async emitAIStarted(
        batchNumber: number,
        provider: string,
        model: string,
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("ai:started", {
            importId: this.importId,
            stage: "ai_generation",
            timestamp: new Date(),
            batchNumber,
            provider,
            model,
            statistics,
            metadata,
        });
    }

    public async emitAICompleted(
        batchNumber: number,
        provider: string,
        model: string,
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("ai:completed", {
            importId: this.importId,
            stage: "ai_generation",
            timestamp: new Date(),
            batchNumber,
            provider,
            model,
            statistics,
            metadata,
        });
    }

    public async emitValidationStarted(
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("validation:started", {
            importId: this.importId,
            stage: "validation",
            timestamp: new Date(),
            statistics,
            metadata,
        });
    }

    public async emitValidationCompleted(
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("validation:completed", {
            importId: this.importId,
            stage: "validation",
            timestamp: new Date(),
            statistics,
            metadata,
        });
    }

    public async emitCompleted(
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("import:completed", {
            importId: this.importId,
            stage: "completion",
            timestamp: new Date(),
            statistics,
            metadata,
        });
    }

    public async emitFailed(
        error: Error,
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("import:failed", {
            importId: this.importId,
            stage: "failure",
            timestamp: new Date(),
            error,
            statistics,
            metadata,
        });
    }

    public async emitCancelled(
        reason: string,
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("import:cancelled", {
            importId: this.importId,
            stage: "cancellation",
            timestamp: new Date(),
            reason,
            statistics,
            metadata,
        });
    }

    public async emitProgressChanged(
        progress: number,
        stage: string,
        statistics?: ImportStats,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.eventBus.publish("progress:changed", {
            importId: this.importId,
            stage,
            timestamp: new Date(),
            progress,
            statistics,
            metadata,
        });
    }
}
