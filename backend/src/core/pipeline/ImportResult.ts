export interface ImportStageError {
    row?: number;
    message: string;
    code?: string;
}

export interface ImportResult {
    success: boolean;
    importId: string;
    processedRows: number;
    successfulRows: number;
    failedRows: number;
    errors: ImportStageError[];
    metadata?: Record<string, unknown>;
    durationMs?: number;
}
