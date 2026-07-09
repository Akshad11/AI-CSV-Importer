export interface ImportProgress {
    stage: string;
    percentage: number; // 0 to 100
    processedRows: number;
    totalRows: number;
    message?: string;
}
