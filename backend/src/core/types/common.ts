export type Nullable<T> = T | null;

export type Dictionary<T> = Record<string, T>;

export interface IDisposable {
    dispose(): Promise<void> | void;
}

export type UUID = string;

export interface ImportStats {
    totalRows: number;
    processedRows: number;
    successfulRows: number;
    failedRows: number;
    startedAt: Date;
    completedAt?: Date;
}
