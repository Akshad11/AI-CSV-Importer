import { CsvRow } from "../csv/csv.types";

export interface CsvBatch {
    id: string;

    batchNumber: number;

    totalRows: number;

    rows: CsvRow[];
}