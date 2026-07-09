export interface CsvRow {
    [column: string]: string;
}

export interface CsvStreamMetadata {

    headers: string[];

    totalRows: number;

    skippedRows: number;

    durationMs: number;

}