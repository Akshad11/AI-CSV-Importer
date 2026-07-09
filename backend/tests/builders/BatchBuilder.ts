import { CsvBatch } from "../../src/services/batch/batch.types";
import { CsvRow } from "../../src/services/csv/csv.types";

export class BatchBuilder {
    private batch: CsvBatch = {
        id: "batch-default",
        batchNumber: 1,
        totalRows: 0,
        rows: []
    };

    public withId(id: string): this {
        this.batch.id = id;
        return this;
    }

    public withBatchNumber(batchNumber: number): this {
        this.batch.batchNumber = batchNumber;
        return this;
    }

    public withRows(rows: CsvRow[]): this {
        this.batch.rows = rows;
        this.batch.totalRows = rows.length;
        return this;
    }

    public build(): CsvBatch {
        return { ...this.batch };
    }
}
