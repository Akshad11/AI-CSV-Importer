import { CsvRow } from "../services/csv/csv.types";
import { CsvBatch } from "../services/batch/batch.types";
import { AIResponse } from "../services/ai/ai.types";
import { CrmLead } from "../schemas/crmLead.schema";
import { ImportContext } from "../core/pipeline/ImportContext";
import { ImportResult as CoreImportResult } from "../core/pipeline/ImportResult";

export type ImportStatus = "completed" | "failed" | "cancelled";

export interface ImportStageError {
    row?: number;
    batchNumber?: number;
    message: string;
    code?: string;
}

export interface OrchestratorStatistics {
    totalRows: number;
    processedRows: number;
    successfulRows: number;
    failedRows: number;
    skippedRows: number;
    totalBatches: number;
    completedBatches: number;
    failedBatches: number;
    aiCalls: number;
    totalTokens: number;
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
}

export interface ImportResult extends CoreImportResult {
    status: ImportStatus;
    statistics: OrchestratorStatistics;
    crmRecords: CrmLead[];
    warnings: string[];
    duration: number;
    startedAt: Date;
    completedAt: Date;
}

export interface IStage<TIn = any, TOut = any> {
    readonly name: string;
    execute(input: AsyncIterable<TIn>, context: ImportContext): AsyncIterable<TOut>;
}

export interface Pipeline {
    readonly stages: IStage[];
    execute(context: ImportContext): Promise<ImportResult>;
}
