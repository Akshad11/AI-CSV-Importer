import { CancellationToken } from "../cancellation/CancellationToken";
import { EventBus } from "../events/EventBus";
import { ProgressEmitter } from "../events/ProgressEmitter";
import { ILogger } from "../interfaces/ILogger";
import { ImportStats } from "../types/common";
import { ImportProgress } from "./ImportProgress";

export interface ImportContextOptions {
    importId: string;
    requestId: string;
    provider: string;
    model: string;
    batchSize: number;
    filePath: string;
    originalFileName: string;
    cancellationToken?: CancellationToken;
    eventBus?: EventBus;
    logger: ILogger;
    config?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export class ImportContext {
    public readonly importId: string;
    public readonly requestId: string;
    public readonly provider: string;
    public readonly model: string;
    public readonly batchSize: number;
    public readonly filePath: string;
    public readonly originalFileName: string;
    public readonly startedAt: Date;
    public readonly cancellationToken: CancellationToken;
    public readonly eventBus: EventBus;
    public readonly progressEmitter: ProgressEmitter;
    public readonly logger: ILogger;
    public readonly config: Record<string, unknown>;
    public readonly metadata: Record<string, unknown>;
    public readonly statistics: ImportStats;

    private _progress: ImportProgress;

    constructor(options: ImportContextOptions) {
        this.importId = options.importId;
        this.requestId = options.requestId;
        this.provider = options.provider;
        this.model = options.model;
        this.batchSize = options.batchSize;
        this.filePath = options.filePath;
        this.originalFileName = options.originalFileName;
        this.startedAt = new Date();
        this.cancellationToken = options.cancellationToken || CancellationToken.None;
        this.eventBus = options.eventBus || new EventBus();
        this.progressEmitter = new ProgressEmitter(this.eventBus, this.importId);
        this.logger = options.logger;
        this.config = options.config || {};
        this.metadata = options.metadata || {};

        this.statistics = {
            totalRows: 0,
            processedRows: 0,
            successfulRows: 0,
            failedRows: 0,
            startedAt: this.startedAt,
        };

        this._progress = {
            stage: "initialization",
            percentage: 0,
            processedRows: 0,
            totalRows: 0,
        };
    }

    public get progress(): ImportProgress {
        return this._progress;
    }

    /**
     * Updates progress details and fires progress event.
     */
    public async updateProgress(progressUpdate: Partial<ImportProgress>): Promise<void> {
        this._progress = {
            ...this._progress,
            ...progressUpdate,
        };

        this.statistics.processedRows = this._progress.processedRows;
        this.statistics.totalRows = this._progress.totalRows;

        await this.progressEmitter.emitProgressChanged(
            this._progress.percentage,
            this._progress.stage,
            this.statistics,
            this.metadata
        );
    }

    /**
     * Safely increment success rows statistic.
     */
    public incrementSuccessRows(count: number = 1): void {
        this.statistics.successfulRows += count;
    }

    /**
     * Safely increment failed rows statistic.
     */
    public incrementFailedRows(count: number = 1): void {
        this.statistics.failedRows += count;
    }
}
